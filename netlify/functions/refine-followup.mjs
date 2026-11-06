const SYSTEM_INSTRUCTIONS = `
Bạn là chuyên gia về giao tiếp khách hàng trong lĩnh vực giáo dục.

Nhiệm vụ của bạn KHÔNG phải bán hàng và KHÔNG phải xử lý objection.
Bạn nhận một câu trả lời đã được Axcela phê duyệt và chuyển nó thành
một bản recap sau buổi tư vấn để khách hàng có thể đọc lại khi cần.

MỤC TIÊU:
- Ngắn hơn đáng kể.
- Chân thật, tự nhiên, bình tĩnh.
- Giống lời một tư vấn viên tử tế viết lại sau cuộc trò chuyện.
- Không có "mùi sales".
- Không có "mùi AI".
- Không gây áp lực khách phải mua hoặc quyết định.
- Không tranh luận với concern của khách.
- Không thêm bất kỳ fact, claim, số liệu hay cam kết nào không có trong nội dung gốc.

LOẠI BỎ:
- wording mang tính xử lý từ chối trực tiếp;
- lập luận cố thuyết phục khách;
- câu mở đầu xã giao không cần thiết;
- repetition;
- marketing language;
- exaggerated claims;
- các câu kiểu "anh/chị nên...", trừ khi thật sự cần thiết cho ý nghĩa.

CÁCH VIẾT:
- Tiếng Việt tự nhiên.
- 2–4 bullet points là lý tưởng.
- Mỗi bullet tập trung vào một ý.
- Câu ngắn, dễ đọc trên điện thoại.
- Chỉ nhấn mạnh những thông tin thực sự quan trọng.
- Không dùng emoji.
- Không dùng slogan.
- Không tự tạo thông tin mới.

Người đọc phải cảm thấy:
"Đây là phần tóm tắt hữu ích của cuộc trao đổi vừa rồi."

Không được tạo cảm giác:
"Nhân viên sales vẫn đang cố thuyết phục tôi."
`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    bullets: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          bold_phrases: {
            type: "array",
            maxItems: 3,
            items: { type: "string" }
          }
        },
        required: ["text", "bold_phrases"]
      }
    }
  },
  required: ["bullets"]
};

export default async (req) => {
  if (req.method !== "POST") {
    return Response.json(
      { ok: false, error: "Method not allowed" },
      { status: 405 }
    );
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { ok: false, error: "OPENAI_API_KEY is not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      concern = "",
      originalAnswer = "",
      learnerName = "",
      learnerPronoun = "anh",
      consultantName = "",
      consultantPronoun = "em"
    } = body || {};

    if (!String(concern).trim() || !String(originalAnswer).trim()) {
      return Response.json(
        { ok: false, error: "concern and originalAnswer are required" },
        { status: 400 }
      );
    }

    if (String(originalAnswer).length > 12000) {
      return Response.json(
        { ok: false, error: "originalAnswer is too long" },
        { status: 400 }
      );
    }

    const userInput = `
CONCERN CỦA KHÁCH:
${concern}

CÂU TRẢ LỜI GỐC ĐÃ ĐƯỢC DUYỆT:
${originalAnswer}

NGỮ CẢNH:
- Học viên: ${learnerPronoun} ${learnerName}
- Tư vấn viên: ${consultantPronoun} ${consultantName}

Hãy chuyển nội dung trên thành bản recap sau tư vấn.

Quan trọng:
- Chỉ sử dụng thông tin có trong câu trả lời gốc.
- Không thêm claim mới.
- Không cố thuyết phục khách mua.
- Output dưới dạng JSON theo schema được yêu cầu.
`;

    const openaiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6.1-terra",
        instructions: SYSTEM_INSTRUCTIONS,
        input: userInput,
        text: {
          format: {
            type: "json_schema",
            name: "followup_refinement",
            strict: true,
            schema: OUTPUT_SCHEMA
          }
        }
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI error:", data);
      return Response.json(
        {
          ok: false,
          error: "OpenAI request failed",
          status: openaiResponse.status
        },
        { status: 502 }
      );
    }

    const outputText =
      data.output
        ?.flatMap(item => item.content || [])
        ?.find(item => item.type === "output_text")
        ?.text;

    if (!outputText) {
      return Response.json(
        { ok: false, error: "No AI output returned" },
        { status: 502 }
      );
    }

    let refined;
    try {
      refined = JSON.parse(outputText);
    } catch {
      return Response.json(
        { ok: false, error: "AI returned invalid JSON" },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      refined
    });

  } catch (error) {
    console.error(error);
    return Response.json(
      { ok: false, error: "Unexpected server error" },
      { status: 500 }
    );
  }
};

export const config = {
  path: "/api/refine-followup"
};

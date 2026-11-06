const SYSTEM_INSTRUCTIONS = `
Bạn là chuyên gia về giao tiếp khách hàng trong lĩnh vực giáo dục.

Nhiệm vụ của bạn KHÔNG phải bán hàng và KHÔNG phải xử lý objection.
Bạn nhận một câu trả lời đã được Axcela phê duyệt và chuyển nó thành
một bản recap sau buổi tư vấn để khách hàng có thể đọc lại khi cần.

MỤC TIÊU:
- Viết như một người thật đang tiếp tục cuộc trò chuyện sau buổi tư vấn.
- Có mở đầu, có dẫn dắt, có phần giải thích chính và có câu kết nhẹ.
- Ngắn hơn bản gốc nhưng vẫn giữ được câu chuyện và logic.
- Chân thật, bình tĩnh, gần gũi, không kiểu marketing.
- Không có "mùi sales".
- Không có "mùi AI".
- Không gây áp lực khách phải mua hoặc quyết định.
- Không tranh luận với concern của khách.
- Không thêm bất kỳ fact, claim, số liệu hay cam kết nào không có trong nội dung gốc.

CẤU TRÚC ƯU TIÊN:
1. INTRO
   - 1–2 câu mở đầu tự nhiên.
   - Thừa nhận concern hoặc đặt lại vấn đề theo cách nhẹ nhàng.
   - Tạo cảm giác đang tiếp tục câu chuyện vừa trao đổi, không phải bắt đầu một sales pitch mới.

2. BODY
   - Thường dùng 2–3 bullet.
   - Mỗi bullet là 1 ý hoàn chỉnh, thường 1–2 câu.
   - Mỗi bullet phải có giải thích và ý nghĩa, không phải fact list.
   - Giữ đủ mạch logic để khách đọc lại sau vài ngày vẫn hiểu.
   - Với câu trả lời gốc dài, giữ khoảng 60–75% phần thông tin hữu ích.

3. CLOSING
   - 1 câu kết nhẹ để khép lại ý.
   - Có thể nhắc lại điều quan trọng nhất cần cân nhắc.
   - Tuyệt đối không CTA mua hàng, không thúc ép quyết định.

GIỌNG ĐIỆU:
- Tiếng Việt tự nhiên, conversational nhưng vẫn chuyên nghiệp.
- Có đầu có đuôi, có nhịp nói, có dẫn dắt.
- Không biến thành brochure.
- Không biến thành note nội bộ.
- Không lặp tên Axcela ở mọi bullet.
- Chỉ bold 1–2 cụm thực sự quan trọng mỗi bullet.
- Không emoji.
- Không slogan.
- Không tự tạo thông tin mới.

CÁCH CHUYỂN GIỌNG:
- Không viết: "Anh/chị đừng lo vì..."
  Nên viết: "Điểm em muốn làm rõ thêm là..."
- Không viết: "Thực tế đây không phải là vấn đề..."
  Nên viết: "Nếu nhìn theo hướng thực tế, điều cần cân nhắc thêm là..."
- Không viết: "Anh/chị nên..."
  Nên viết: "Anh/chị có thể cân nhắc thêm..."

Người đọc phải cảm thấy:
"Đây là người tư vấn đang nói lại với tôi một cách dễ hiểu và có đầu có đuôi."

Không được tạo cảm giác:
"Đây là AI tóm tắt thành mấy bullet" hoặc "Sales vẫn đang cố thuyết phục tôi."
`;

const OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intro: {
      type: "string"
    },
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
            maxItems: 2,
            items: { type: "string" }
          }
        },
        required: ["text", "bold_phrases"]
      }
    },
    closing: {
      type: "string"
    }
  },
  required: ["intro", "bullets", "closing"]
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
- Viết như người thật đang tiếp tục cuộc trò chuyện sau buổi tư vấn.
- Phải có intro tự nhiên, body có 2–3 bullet đủ ý, và closing nhẹ.
- Không tóm tắt thành các câu cụt hoặc fact list.
- Mỗi bullet phải đủ ý và có ngữ cảnh để khách đọc lại vẫn hiểu.
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

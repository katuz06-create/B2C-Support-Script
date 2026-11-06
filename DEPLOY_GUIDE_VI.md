# HƯỚNG DẪN ĐƯA PROJECT LÊN GITHUB + NETLIFY

## 1. Tạo GitHub repository

Tạo repo mới tên gợi ý:

`axcela-sales-assistant`

Khuyến nghị:
- Visibility: Private
- Không cần tạo thêm README nếu bạn upload nguyên project ZIP này.

## 2. Upload project

Giải nén file ZIP project.

Trong GitHub repo:
- Add file
- Upload files
- Kéo toàn bộ nội dung BÊN TRONG folder `axcela-sales-assistant` lên repo.

Ở root repo phải nhìn thấy:
- index.html
- netlify.toml
- .gitignore
- .env.example
- README.md
- DEPLOY_GUIDE_VI.md
- folder netlify/

Không upload API key.

## 3. Kết nối GitHub với Netlify

Trong Netlify:

- Add new project / Import an existing project
- Chọn GitHub
- Chọn repo `axcela-sales-assistant`
- Publish directory: `.`
- Functions directory sẽ được đọc từ `netlify.toml`

Nếu muốn giữ site production hiện tại, hãy connect repo vào đúng site hiện tại thay vì tạo URL mới.

## 4. Thêm OpenAI API key

Netlify:
Project configuration
→ Environment variables
→ Add variable

Tạo:

`OPENAI_API_KEY`
= API key thật của bạn

Tạo thêm:

`OPENAI_MODEL`
= `gpt-6.1-terra`

API key chỉ nhập tại Netlify. Không paste key vào GitHub, HTML, README hoặc chat.

## 5. Redeploy

Sau khi thêm environment variables:
- Trigger deploy / Redeploy latest deploy.

Netlify sẽ deploy:
- `index.html`
- serverless function `refine-followup.mjs`

Endpoint backend sẽ là:

`/api/refine-followup`

## 6. Trạng thái hiện tại

Bộ project này mới chuẩn bị backend AI.

Frontend `index.html` vẫn là V8 landscape hiện tại và CHƯA có nút AI refine.

Sau khi GitHub + Netlify + API key setup xong, bước kế tiếp là nâng frontend thành V8.1:
- AI làm gọn
- AI làm gọn tất cả
- Dùng bản AI
- Thử lại
- Quay về bản gốc

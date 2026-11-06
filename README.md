# Axcela Sales Assistant

Internal Sales Support and Consultation Follow-up tool for Axcela.

## Current project state

- `index.html`: V8 landscape frontend currently used as the stable baseline.
- Google Sheets + Apps Script: existing Knowledge Base and feedback backend.
- `netlify/functions/refine-followup.mjs`: server-side OpenAI endpoint prepared for V8.1 AI refinement.
- The current `index.html` does **not yet call the AI function**. That frontend integration is the next V8.1 step.

## Architecture

- Frontend: Single-file HTML
- Hosting: Netlify
- Source control: GitHub
- Knowledge Base: Google Sheets
- Knowledge API: Google Apps Script
- AI refinement: OpenAI Responses API
- AI backend: Netlify Functions

## Repository structure

```text
axcela-sales-assistant/
├── index.html
├── netlify.toml
├── .gitignore
├── .env.example
├── README.md
├── DEPLOY_GUIDE_VI.md
└── netlify/
    └── functions/
        └── refine-followup.mjs
```

## Security

Never commit an OpenAI API key to GitHub.

The production secret must be stored in:

**Netlify → Project configuration → Environment variables**

Required variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (recommended default: `gpt-6.1-terra`)

## AI principle

AI may:

- shorten approved answers;
- restructure them into 2–4 readable bullets;
- make the Vietnamese more natural and human;
- mark a few genuinely important phrases for bold formatting.

AI must never:

- invent facts;
- add commitments or guarantees;
- change approved program information;
- introduce unsupported claims;
- pressure the customer to purchase.

## Endpoint

After Netlify deploys the function:

```text
POST /api/refine-followup
```

Example request:

```json
{
  "concern": "Học phí bên em cao quá.",
  "originalAnswer": "Approved answer from the Knowledge Base...",
  "learnerName": "Nam",
  "learnerPronoun": "anh",
  "consultantName": "Ngọc",
  "consultantPronoun": "em"
}
```

The next project step is to update `index.html` to add:

- AI làm gọn câu này
- AI làm gọn tất cả
- Dùng bản AI
- Thử lại
- Quay về bản gốc

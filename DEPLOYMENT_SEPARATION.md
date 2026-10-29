# Deployment separation

## Bot / Backend
The bot ZIP contains the Telegram bot and Flask API. It does not contain Mini App frontend files.
Set `MINIAPP_WEBAPP_URL` to the separately hosted Mini App URL.

## Mini App / Frontend
The Mini App ZIP contains the React/TypeScript source under `src/` and the preserved production build under `dist/`.
For a separate frontend host, build with `VITE_API_BASE_URL` pointing at the Bot/Flask API origin.

Admin page: `src/pages/Admin/`
Reseller page: `src/pages/Reseller/`

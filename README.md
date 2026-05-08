# Edge TTS API

REST API wrapping Microsoft Edge's Text-to-Speech service. Built with NestJS + `msedge-tts`.

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/tts/voices?locale=pt` | List voices (optional locale filter, e.g. `pt`, `pt-BR`, `en-US`) |
| POST | `/tts/synthesize` | Convert text → audio binary |
| GET | `/api-docs` | Swagger UI |

### POST /tts/synthesize

Request JSON:
```json
{
  "text": "Olá, mundo!",
  "voice": "pt-BR-FranciscaNeural",
  "format": "mp3",
  "rate": 1.0,
  "pitch": 1.0,
  "volume": 1.0
}
```

- `voice` (optional, default `pt-BR-FranciscaNeural`) — any Edge TTS ShortName from `/tts/voices`.
- `format` (optional, default `mp3`) — `mp3` or `opus` (webm container).
- `rate`, `pitch`, `volume` (optional, 0.5–2.0) — prosody multipliers.

Response: raw audio bytes (`audio/mpeg` or `audio/webm`).

> Note: WAV is not natively produced by Edge TTS. Convert MP3 to WAV downstream with ffmpeg if required.

## Local development

```bash
cd nodejs_space
yarn install
yarn start:dev
```

Test:
```bash
curl http://localhost:3000/health
curl 'http://localhost:3000/tts/voices?locale=pt-BR'
curl -X POST http://localhost:3000/tts/synthesize \
  -H 'Content-Type: application/json' \
  -d '{"text":"Olá, isto é um teste"}' --output speech.mp3
```

## Docker

```bash
docker compose up -d --build
```

The container exposes port `3000` and includes a healthcheck against `/health`.

## Deploy on Coolify (Hostinger VPS)

1. **Push this repo** to GitHub/GitLab (or any git source Coolify can reach).
2. In Coolify dashboard → **+ New Resource → Application**.
3. Choose your Git source, select the repo and branch.
4. **Build Pack**: choose **Dockerfile** (Coolify will detect `./Dockerfile`). Alternatively choose **Docker Compose** and point to `docker-compose.yml`.
5. **Port**: set exposed port to `3000`.
6. **Domain**: assign a domain or subdomain (e.g. `tts.yourdomain.com`). Coolify provisions HTTPS via Let's Encrypt automatically.
7. **Environment variables** (optional):
   - `PORT=3000` (default)
   - `NODE_ENV=production`
8. **Healthcheck**: path `/health`, port `3000`.
9. Click **Deploy**. Wait for build + container to be healthy.
10. Visit `https://tts.yourdomain.com/api-docs` to confirm.

### Updating
Push a new commit; Coolify auto-redeploys (if webhook is enabled) or click **Redeploy**.

## n8n Integration

Use an **HTTP Request** node in your n8n workflow:

- **Method**: `POST`
- **URL**: `https://tts.yourdomain.com/tts/synthesize`
- **Authentication**: None (or add a reverse-proxy auth layer if needed)
- **Send Body**: ✅, **Body Content Type**: `JSON`
- **JSON Body**:
  ```json
  {
    "text": "={{ $json.message }}",
    "voice": "pt-BR-FranciscaNeural",
    "format": "mp3"
  }
  ```
- **Response → Response Format**: `File` (so n8n stores the binary audio).
- **Put Output in Field**: `data` (or any binary property name).

The next node (e.g. Telegram, WhatsApp, Email, S3) can then send/store the audio binary directly.

### Listing voices in n8n
Use an HTTP Request node with `GET https://tts.yourdomain.com/tts/voices?locale=pt-BR` to dynamically populate voice options.

## Notes

- Voices list is cached for 1 hour in memory.
- Service is stateless — scale horizontally behind a load balancer if needed.
- Edge TTS is unofficial; Microsoft may rate-limit aggressive usage.

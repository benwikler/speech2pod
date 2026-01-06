# Speech2Pod

Convert YouTube speeches into podcast episodes with AI-generated metadata.

![Speech2Pod](https://img.shields.io/badge/Speech2Pod-v1.0-purple)

## Features

- **YouTube to Podcast**: Paste any YouTube URL to convert speeches into podcast episodes
- **AI Metadata Generation**: Claude automatically extracts speaker name, date, venue, topic, and generates a summary
- **Audio Processing**: Automatic loudness normalization (EBU R128) and silence trimming
- **Visual Cropping**: Waveform visualization with drag-to-crop functionality
- **Private RSS Feed**: Subscribe in any podcast app (Apple Podcasts, Overcast, Pocket Casts, etc.)
- **Beautiful UI**: Apple Podcasts-inspired preview cards

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Wavesurfer.js
- **Backend**: Python + FastAPI + yt-dlp + FFmpeg
- **AI**: Claude API (Anthropic)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Database**: PostgreSQL (production) / SQLite (development)

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- FFmpeg
- Docker (optional)

### Local Development

1. **Clone and setup backend**:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure environment**:

```bash
cp .env.example .env
# Edit .env with your API keys
```

3. **Run backend**:

```bash
cd backend
uvicorn app.main:app --reload
```

4. **Setup and run frontend**:

```bash
cd frontend
npm install
npm run dev
```

5. Open http://localhost:5173

### Docker

```bash
# Copy environment file
cp .env.example .env
# Edit .env with your credentials

# Run with Docker Compose
docker-compose up -d
```

Access at http://localhost:3000

## Configuration

### Required Environment Variables

```env
# Cloudflare R2 Storage
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=speech2pod
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Claude API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Podcast Feed
PODCAST_TITLE=Speech2Pod
PODCAST_DESCRIPTION=Political speeches converted to podcast format
PODCAST_BASE_URL=https://your-app.railway.app
```

### Cloudflare R2 Setup

1. Create a Cloudflare account at [cloudflare.com](https://cloudflare.com)
2. Go to R2 in the dashboard
3. Create a new bucket (e.g., `speech2pod`)
4. Go to **Manage R2 API Tokens** and create a token with read/write permissions
5. Enable public access for your bucket:
   - Go to bucket settings
   - Enable "Public Access"
   - Copy the public URL (e.g., `https://pub-xxxxx.r2.dev`)

## Deployment

### Backend (Railway)

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repo
3. Add a PostgreSQL database
4. Set environment variables
5. Deploy!

Railway will automatically:
- Detect the Dockerfile
- Build and deploy
- Provide a public URL

### Frontend (Vercel)

1. Import project on [Vercel](https://vercel.com)
2. Set the root directory to `frontend`
3. Add environment variable:
   - `VITE_API_URL`: Your Railway backend URL
4. Deploy!

### Subscribe to Your Podcast

After deploying, your RSS feed will be available at:
```
https://your-backend.railway.app/api/feed.xml
```

Add this URL to your podcast app:
- **Apple Podcasts**: Library → Show → Add a Show by URL
- **Overcast**: + → Add URL
- **Pocket Casts**: Search → Add by URL

## Future Features (Extensibility)

The codebase is designed for easy extension:

### AI Voice Intros/Outros
The data model already supports `intro_audio_url`, `outro_audio_url`, and `use_ai_intro` fields. To add:
1. Integrate ElevenLabs or OpenAI TTS API
2. Use `AIService.generate_intro_script()` to create scripts
3. Generate audio and concatenate with `AudioService.concatenate_audio()`

### Custom Recorded Intros
1. Add file upload endpoint
2. Store in R2
3. Use `AudioService.concatenate_audio()` to prepend

## API Reference

### Analyze Video
```
POST /api/analyze
Body: { "url": "https://youtube.com/watch?v=..." }
```

### Start Extraction
```
POST /api/extract
Body: { "youtube_id": "...", "youtube_url": "..." }
```

### Get Job Status
```
GET /api/extract/{job_id}
```

### Episodes CRUD
```
GET    /api/episodes
POST   /api/episodes
GET    /api/episodes/{id}
PUT    /api/episodes/{id}
DELETE /api/episodes/{id}
POST   /api/episodes/{id}/publish
POST   /api/episodes/{id}/unpublish
```

### RSS Feed
```
GET /api/feed.xml
GET /feed.xml
```

## License

MIT

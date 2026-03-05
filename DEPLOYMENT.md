# Deploying Paper to Google Cloud Run

## Architecture

```
Browser → HTTPS (Cloud Run) → Express (serves API + static frontend)
```

Single container serves the Vite-built frontend and the Express API on one port.

## Prerequisites

- Google Cloud CLI (`gcloud`) installed and authenticated
- A GCP project with billing enabled
- Docker installed locally (optional, for local testing)

## First-Time Setup

### 1. Install Google Cloud CLI

```bash
brew install google-cloud-sdk
```

### 2. Authenticate

```bash
gcloud auth login
```

### 3. Set your project

```bash
gcloud config set project YOUR_PROJECT_ID
```

If you don't have a project yet:

```bash
gcloud projects create my-paper-game --name="Paper"
gcloud config set project my-paper-game
gcloud billing accounts list
gcloud billing projects link my-paper-game --billing-account=BILLING_ACCOUNT_ID
```

### 4. Enable required APIs

```bash
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
```

## Deploy

From the project root:

```bash
gcloud run deploy paper \
  --source . \
  --region us-west1 \
  --allow-unauthenticated \
  --max-instances 3
```

Cloud Run automatically sets the `PORT` environment variable. The app reads it at startup.

On first deploy, you may be prompted to enable additional APIs or create an Artifact Registry repository — say yes to both.

When complete, the CLI prints the service URL (e.g. `https://paper-xxxxx-uw.a.run.app`).

## Redeploying

Run the same `gcloud run deploy` command. Cloud Run builds a new container and performs a zero-downtime rollout.

## Local Docker Testing

```bash
docker build -t paper .
docker run -p 3000:3000 paper
# Visit http://localhost:3000
```

## How It Works

- **Dockerfile** builds the frontend (`npm run build` → `dist/`) and compiles the server TypeScript (`tsc` → `dist-server/`)
- In production, Express serves the static frontend from `dist/` and handles API routes under `/api/*`
- The SPA catch-all routes all non-API, non-file requests to `index.html`

## Database

SQLite is **ephemeral** on Cloud Run — the database resets on each deploy or instance restart. This is fine for casual game sessions. For persistent data, consider:

- **Cloud SQL** (PostgreSQL) — managed relational DB
- **Firestore** — serverless NoSQL
- **Cloud Run volume mounts** — attach persistent storage

## Cost Estimate

- **Cloud Run**: ~$0-5/month (free tier: 2M requests/month, 360K vCPU-seconds)
- **Artifact Registry**: minimal storage costs
- **Custom domain**: ~$12/year (optional)

## Custom Domain (Optional)

```bash
gcloud run domain-mappings create \
  --service paper \
  --domain your-domain.com \
  --region us-west1
```

Then add the DNS records shown in the output.

## Troubleshooting

- **Build fails on `better-sqlite3`**: The Dockerfile installs `python3 make g++` for native compilation. If you change the base image, ensure these are present.
- **App crashes on startup**: Check logs with `gcloud run logs read --service paper --region us-west1`
- **API returns 404**: Make sure routes are prefixed with `/api/` — the SPA catch-all will swallow non-prefixed routes in production.

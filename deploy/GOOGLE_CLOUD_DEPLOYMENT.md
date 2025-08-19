# Google Cloud Run Deployment Guide

This guide explains how to deploy the finances-next application to Google Cloud Run.

## Prerequisites

1. **Google Cloud Project**: Create a GCP project if you don't have one
2. **Enable APIs**: Enable the following APIs in your project:
   - Cloud Run API
   - Artifact Registry API
   - Secret Manager API
   - Cloud Build API (optional, for local builds)

## Setup Instructions

### 1. Create Google Cloud Project
```bash
# Create a new project (optional)
gcloud projects create YOUR_PROJECT_ID

# Set the project
gcloud config set project YOUR_PROJECT_ID
```

### 2. Enable Required APIs
```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 3. Set up GitHub Actions (Recommended)

#### Configure Workload Identity Federation
```bash
# Create a service account
gcloud iam service-accounts create github-actions \
  --description="Service account for GitHub Actions" \
  --display-name="GitHub Actions"

# Add necessary roles
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# Create Workload Identity Pool
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --description="Pool for GitHub Actions"

# Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='YOUR_GITHUB_USERNAME/finances-next'"

# Bind service account to workload identity
gcloud iam service-accounts add-iam-policy-binding \
  --role roles/iam.workloadIdentityUser \
  --member "principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/finances-next" \
  github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
```

#### GitHub Secrets
Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

```
GCP_PROJECT_ID=your-project-id
WIF_PROVIDER=projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider
WIF_SERVICE_ACCOUNT=github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com
DB_URL=your-mongodb-connection-string
DB_NAME=your-database-name
```

### 4. Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# Build and push the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/finances-next

# Deploy to Cloud Run
gcloud run deploy finances-next \
  --image gcr.io/YOUR_PROJECT_ID/finances-next \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 3 \
  --concurrency 50 \
  --timeout 300 \
  --set-env-vars NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1 \
  --set-secrets DB_URL=finances-secrets:latest,DB_NAME=finances-secrets:latest
```

## Environment Variables

The application uses these environment variables:

- `NODE_ENV`: Set to "production"
- `DB_URL`: MongoDB connection string (stored in Secret Manager)
- `DB_NAME`: Database name (stored in Secret Manager)
- `NEXT_TELEMETRY_DISABLED`: Set to "1" to disable telemetry

## Monitoring and Logs

- **Logs**: View in Google Cloud Console > Cloud Run > Service > Logs
- **Metrics**: Built-in monitoring in Cloud Run console
- **Health Check**: Available at `/api/health`

## Cost Optimization

The configuration includes:
- **Min instances**: 0 (scales to zero when not in use)
- **Max instances**: 3 (limits maximum cost)
- **Memory**: 512Mi (balanced for Next.js apps)
- **CPU**: 1 vCPU (sufficient for most workloads)
- **Concurrency**: 50 requests per instance

## Troubleshooting

### Common Issues

1. **Permission Denied**: Ensure all IAM roles are properly assigned
2. **Build Failures**: Check that Docker build works locally
3. **Secret Access**: Verify secrets exist and service account has access
4. **Health Check Fails**: Ensure `/api/health` endpoint returns 200

### Useful Commands

```bash
# View service logs
gcloud run services logs tail finances-next --region=us-central1

# Get service URL
gcloud run services describe finances-next --region=us-central1 --format="value(status.url)"

# Update environment variables
gcloud run services update finances-next \
  --region=us-central1 \
  --set-env-vars NEW_VAR=value

# Scale service
gcloud run services update finances-next \
  --region=us-central1 \
  --min-instances=1 \
  --max-instances=5
```

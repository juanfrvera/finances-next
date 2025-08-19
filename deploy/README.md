# Google Cloud Run Deployment for Finances Next

This directory contains all the files needed to deploy Finances Next to Google Cloud Run.

## 🚀 Quick Start

1. **GitHub Actions (Recommended)**: Follow the [GitHub Actions Guide](./GITHUB_ACTIONS_GUIDE.md) to set up automated deployments
2. **Manual Deployment**: Use the deployment script: `./deploy.sh`
3. **Cloud Build**: Use the `cloudbuild.yaml` for Google Cloud Build triggers

## 📁 Files Overview

- **`.github/workflows/deploy-production.yml`**: GitHub Actions workflow for automated deployment
- **`Dockerfile.production`**: Multi-stage production Docker build
- **`cloudbuild.yaml`**: Google Cloud Build configuration (alternative to GitHub Actions)
- **`deploy.sh`**: Manual deployment script
- **`DEPLOYMENT_CHECKLIST.md`**: Complete deployment checklist and verification steps
- **`GITHUB_ACTIONS_GUIDE.md`**: Step-by-step guide for setting up GitHub Actions

## 🔧 Configuration

### Required Secrets (Google Cloud Secret Manager)

- `DB_URL`: MongoDB connection string
- `DB_NAME`: MongoDB database name
- `JWT_SECRET`: Secret key for JWT authentication (32+ characters)

### GitHub Secrets (for GitHub Actions)

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_SA_KEY`: Service account JSON key for authentication
- `DB_URL`: MongoDB connection string
- `DB_NAME`: MongoDB database name
- `JWT_SECRET`: Secret key for JWT authentication

## 🏗️ Architecture

```
GitHub Repository
       ↓
GitHub Actions (CI/CD)
       ↓
Google Artifact Registry (Container Storage)
       ↓
Google Cloud Run (Serverless Container Hosting)
       ↓
MongoDB Atlas (Database)
```

## 📋 Deployment Methods

### Option 1: GitHub Actions (Recommended)

**Pros:**
- Fully automated on every push to `main`
- Proper CI/CD pipeline
- Built-in security with Workload Identity Federation
- Automatic image cleanup
- Health checks included

**Setup:** Follow [GitHub Actions Guide](./GITHUB_ACTIONS_GUIDE.md)

### Option 2: Manual Deployment

**Pros:**
- Full control over deployment process
- Good for testing and debugging
- No external dependencies

**Usage:**
```bash
# Update PROJECT_ID in deploy.sh first
./deploy.sh
```

### Option 3: Cloud Build

**Pros:**
- Native Google Cloud solution
- Can be triggered by various sources
- Built-in integration with other Google Cloud services

**Setup:**
```bash
gcloud builds submit --config deploy/cloudbuild.yaml
```

## 🔍 Monitoring and Troubleshooting

### Health Check
Your app includes a health check endpoint at `/api/health` that verifies:
- Application is running
- Database connectivity
- Environment configuration

### Logs
View logs in Google Cloud Console:
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=finances-next" --limit=50
```

### Common Issues

1. **Build failures**: Check Dockerfile and dependencies
2. **Authentication errors**: Verify secrets are set correctly
3. **Database connection**: Ensure MongoDB allows Google Cloud Run IPs
4. **OAuth issues**: Check redirect URIs in Google Cloud Console

## 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [MongoDB Atlas Network Access](https://docs.atlas.mongodb.com/security/ip-access-list/)

## 🔒 Security Notes

- All sensitive data is stored in Google Cloud Secret Manager
- No secrets are committed to the repository
- Workload Identity Federation eliminates the need for service account keys
- Container runs as non-root user
- Health checks ensure proper functionality

## 💰 Cost Optimization

- **Minimum instances**: Set to 0 to avoid charges when idle
- **Request timeout**: 300 seconds (5 minutes) maximum
- **Memory allocation**: 2GB (adjust based on actual usage)
- **CPU allocation**: 1 vCPU (can be increased if needed)
- **Image cleanup**: Old images are automatically removed to save storage costs

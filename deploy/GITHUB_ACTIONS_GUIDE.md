# GitHub Actions Setup Guide for Finances Next

This guide will help you set up automated deployments to Google Cloud Run using GitHub Actions.

## Prerequisites

- Google Cloud Project with billing enabled
- GitHub repository for finances-next
- Admin access to both Google Cloud and GitHub

## Step 1: Google Cloud Setup

### 1.1 Enable Required APIs

Open [Google Cloud Shell](https://console.cloud.google.com) and run:

```bash
# Enable necessary APIs
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable iam.googleapis.com

# Set your project ID
export PROJECT_ID=$(gcloud config get-value project)
echo "Project ID: $PROJECT_ID"
```

### 1.2 Create Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions-deployer \
    --description="Service account for GitHub Actions deployments to finances-next" \
    --display-name="GitHub Actions Deployer"

# Get the service account email
export SERVICE_ACCOUNT="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
echo "Service Account: $SERVICE_ACCOUNT"
```

### 1.3 Grant Required Permissions

```bash
# Grant necessary roles to the service account
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT" \
    --role="roles/secretmanager.secretAccessor"
```

### 1.4 Create Workload Identity Pool

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-actions-pool" \
    --project="$PROJECT_ID" \
    --location="global" \
    --display-name="GitHub Actions Pool"

# Get the full pool name
export WORKLOAD_IDENTITY_POOL_ID="projects/${PROJECT_ID}/locations/global/workloadIdentityPools/github-actions-pool"
echo "Pool ID: $WORKLOAD_IDENTITY_POOL_ID"
```

### 1.5 Create Workload Identity Provider

Replace `YOUR-GITHUB-USERNAME` and `finances-next` with your actual GitHub username and repository name:

```bash
# Replace with your GitHub details
export GITHUB_USERNAME="YOUR-GITHUB-USERNAME"
export GITHUB_REPO="finances-next"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --project="$PROJECT_ID" \
    --location="global" \
    --workload-identity-pool="github-actions-pool" \
    --display-name="GitHub Provider" \
    --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
    --issuer-uri="https://token.actions.githubusercontent.com"

# Get the full provider name
export WORKLOAD_IDENTITY_PROVIDER="projects/${PROJECT_ID}/locations/global/workloadIdentityPools/github-actions-pool/providers/github-provider"
echo "Provider: $WORKLOAD_IDENTITY_PROVIDER"
```

### 1.6 Allow GitHub Repository to Use Service Account

```bash
# Allow the GitHub repository to use the service account
gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT \
    --project="$PROJECT_ID" \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/${WORKLOAD_IDENTITY_POOL_ID}/attribute.repository/${GITHUB_USERNAME}/${GITHUB_REPO}"
```

### 1.7 Print Configuration for GitHub Secrets

```bash
echo ""
echo "=== GitHub Secrets Configuration ==="
echo "Add these secrets to your GitHub repository:"
echo ""
echo "GCP_PROJECT_ID: $PROJECT_ID"
echo "WIF_PROVIDER: $WORKLOAD_IDENTITY_PROVIDER"
echo "WIF_SERVICE_ACCOUNT: $SERVICE_ACCOUNT"
echo ""
```

## Step 2: Set Up Application Secrets

### 2.1 Create Application Secrets in Google Cloud

```bash
# Create secrets for the application
# Replace the placeholder values with your actual values

# Database configuration
echo -n "mongodb+srv://username:password@cluster.mongodb.net/finances-next" | gcloud secrets create DB_URL --data-file=-
echo -n "finances-next" | gcloud secrets create DB_NAME --data-file=-

# Authentication configuration
echo -n "$(openssl rand -base64 32)" | gcloud secrets create JWT_SECRET --data-file=-
```

### 2.2 Grant Service Account Access to Secrets

```bash
# Grant the service account access to all secrets
for secret in DB_URL DB_NAME JWT_SECRET; do
    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/secretmanager.secretAccessor"
done
```

## Step 3: Configure GitHub Repository

### 3.1 Add GitHub Secrets

Go to your GitHub repository and add the following secrets (Settings → Secrets and variables → Actions):

- `GCP_PROJECT_ID`: Your Google Cloud Project ID
- `GCP_SA_KEY`: The service account JSON key
- `DB_URL`: MongoDB connection string
- `DB_NAME`: MongoDB database name  
- `JWT_SECRET`: Secret key for JWT authentication

### 3.2 Update Secret Values

Update the secrets in Google Cloud Secret Manager with your actual values:

```bash
# Update DB_URL
echo -n "mongodb+srv://username:password@cluster.mongodb.net/finances-next" | gcloud secrets versions add DB_URL --data-file=-

# Update DB_NAME
echo -n "finances-next" | gcloud secrets versions add DB_NAME --data-file=-

# Update JWT_SECRET
echo -n "$(openssl rand -base64 32)" | gcloud secrets versions add JWT_SECRET --data-file=-
```

## Step 4: Deploy

1. Push your code to the `main` branch
2. Go to the Actions tab in your GitHub repository
3. Watch the deployment process
4. Once complete, your app will be available at the Cloud Run URL

## Step 5: Verify Deployment

After the first deployment:

1. Visit your Cloud Run service URL
2. Test the application functionality
3. Check that authentication works properly
4. Verify database connectivity via the `/api/health` endpoint

## Troubleshooting

### Common Issues

1. **Authentication Failed**: Verify workload identity configuration
2. **Permission Denied**: Check service account roles
3. **Secret Not Found**: Ensure secrets are created and accessible
4. **Build Failed**: Check Dockerfile and dependencies

### Useful Commands

```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --format="table(bindings.role)" --filter="bindings.members:$SERVICE_ACCOUNT"

# List secrets
gcloud secrets list

# View Cloud Run services
gcloud run services list

# View deployment logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=finances-next" --limit=50
```

## Next Steps

- Set up monitoring and alerting
- Configure custom domain (optional)
- Set up staging environment
- Implement database backups
- Configure CDN for static assets

For more details, see the [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md).

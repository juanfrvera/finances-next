# 🚀 Finances Next - Google Cloud Run Deployment Checklist

## Pre-Deployment Setup

### 1. Google Cloud Project Setup
- [ ] Create or select a Google Cloud Project
- [ ] Enable the following APIs:
  - [ ] Cloud Run API
  - [ ] Artifact Registry API
  - [ ] Cloud Build API (optional, for alternative deployment)
- [ ] Install and configure Google Cloud SDK
- [ ] Authenticate: `gcloud auth login`
- [ ] Set project: `gcloud config set project YOUR_PROJECT_ID`

### 2. GitHub Actions Setup (Recommended)
- [ ] Set up Workload Identity Federation for GitHub Actions
- [ ] Create the following GitHub Secrets:
  - [ ] `GCP_PROJECT_ID`: Your Google Cloud Project ID
  - [ ] `WIF_PROVIDER`: Workload Identity Federation Provider
  - [ ] `WIF_SERVICE_ACCOUNT`: Service Account email for GitHub Actions
- [ ] Ensure service account has the following roles:
  - [ ] Cloud Run Admin
  - [ ] Artifact Registry Admin
  - [ ] Service Account User

### 3. Database Setup
- [ ] Set up production MongoDB database (MongoDB Atlas recommended)
- [ ] Configure network access for Google Cloud Run (allow all IPs: `0.0.0.0/0`)
- [ ] Test database connection from your local machine
- [ ] Set up database collections and indexes as needed

### 4. Authentication Setup
- [ ] Create Google OAuth application in Google Cloud Console
- [ ] Set up OAuth consent screen
- [ ] Add authorized redirect URIs for your production domain
- [ ] Note down `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

### 5. Environment Variables / Secrets
Set up the following secrets in Google Cloud Secret Manager:
- [ ] `DATABASE_URL`: MongoDB connection string for main database
- [ ] `MONGODB_URI`: Same as DATABASE_URL (legacy compatibility)
- [ ] `NEXTAUTH_SECRET`: Random 32+ character string for NextAuth.js
- [ ] `NEXTAUTH_URL`: Your production URL (e.g., https://finances-next-xyz.run.app)
- [ ] `GOOGLE_CLIENT_ID`: OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET`: OAuth client secret

Create secrets in Google Cloud:
```bash
echo -n "your-mongodb-uri" | gcloud secrets create DATABASE_URL --data-file=-
echo -n "your-mongodb-uri" | gcloud secrets create MONGODB_URI --data-file=-
echo -n "your-nextauth-secret" | gcloud secrets create NEXTAUTH_SECRET --data-file=-
echo -n "https://your-domain.run.app" | gcloud secrets create NEXTAUTH_URL --data-file=-
echo -n "your-google-client-id" | gcloud secrets create GOOGLE_CLIENT_ID --data-file=-
echo -n "your-google-client-secret" | gcloud secrets create GOOGLE_CLIENT_SECRET --data-file=-
```

## Deployment Options

### Option A: GitHub Actions (Recommended)
1. [ ] Push code to `main` branch
2. [ ] Monitor deployment in GitHub Actions tab
3. [ ] Check deployment logs for any issues
4. [ ] Verify service is running in Google Cloud Console

### Option B: Manual Deployment using gcloud
1. [ ] Build and tag image:
   ```bash
   docker build -f deploy/Dockerfile.production -t us-central1-docker.pkg.dev/PROJECT_ID/finances-next/finances-next .
   ```
2. [ ] Push to Artifact Registry:
   ```bash
   docker push us-central1-docker.pkg.dev/PROJECT_ID/finances-next/finances-next
   ```
3. [ ] Deploy to Cloud Run:
   ```bash
   gcloud run deploy finances-next \
     --image us-central1-docker.pkg.dev/PROJECT_ID/finances-next/finances-next \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --memory 2Gi \
     --cpu 1 \
     --min-instances 0 \
     --max-instances 10 \
     --concurrency 80 \
     --timeout 300 \
     --port 3000 \
     --set-env-vars NODE_ENV=production \
     --set-secrets DATABASE_URL=DATABASE_URL:latest,MONGODB_URI=MONGODB_URI:latest,NEXTAUTH_SECRET=NEXTAUTH_SECRET:latest,NEXTAUTH_URL=NEXTAUTH_URL:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest
   ```

### Option C: Cloud Build
1. [ ] Update `deploy/cloudbuild.yaml` with your project details
2. [ ] Set up Cloud Build trigger connected to your Git repository
3. [ ] Push code to trigger automatic deployment

## Post-Deployment Verification

### 1. Basic Functionality
- [ ] Visit your Cloud Run service URL
- [ ] Check home page loads correctly
- [ ] Test the health endpoint: `/api/health`
- [ ] Verify database connection is working

### 2. Authentication Flow
- [ ] Test Google OAuth login
- [ ] Verify user sessions are created correctly
- [ ] Check that protected routes redirect to login
- [ ] Test logout functionality

### 3. Finance Features
- [ ] Create a test account
- [ ] Add test transactions
- [ ] Verify data persistence in database
- [ ] Test dashboard charts and calculations
- [ ] Check currency conversion features

### 4. Performance & Monitoring
- [ ] Check Cloud Run logs for any errors
- [ ] Monitor response times in Cloud Console
- [ ] Verify cold start performance is acceptable
- [ ] Test concurrent user sessions

### 5. Security
- [ ] Verify environment variables are not exposed in logs
- [ ] Check that database credentials are secure
- [ ] Ensure authentication is properly enforced
- [ ] Test CORS settings for API endpoints

## Troubleshooting Common Issues

### Database Connection Issues
- [ ] Check if secrets are properly set in Google Cloud Secret Manager
- [ ] Verify database allows connections from Google Cloud Run IPs
- [ ] Test connection using the `/api/health` endpoint
- [ ] Check Cloud Run logs for connection errors

### Authentication Issues
- [ ] Verify `NEXTAUTH_URL` matches your actual domain
- [ ] Check Google OAuth configuration and redirect URIs
- [ ] Ensure `NEXTAUTH_SECRET` is set and secure
- [ ] Test OAuth flow step by step

### Build/Deployment Issues
- [ ] Check GitHub Actions logs for build errors
- [ ] Verify Dockerfile.production builds successfully locally
- [ ] Ensure all required secrets are set in Google Cloud
- [ ] Check service account permissions

### Performance Issues
- [ ] Monitor memory usage in Cloud Run console
- [ ] Adjust CPU/memory limits if needed
- [ ] Check database query performance
- [ ] Consider implementing connection pooling

## Performance Optimization

### Resource Configuration
- [ ] Monitor actual resource usage
- [ ] Adjust CPU allocation (0.5-4 cores)
- [ ] Optimize memory allocation (512MB-8GB)
- [ ] Configure appropriate concurrency limits

### Scaling Configuration
- [ ] Set minimum instances (0 for cost optimization)
- [ ] Set maximum instances based on expected load
- [ ] Configure request timeout appropriately
- [ ] Monitor scaling behavior

### Database Optimization
- [ ] Implement proper MongoDB indexes
- [ ] Use connection pooling
- [ ] Optimize query patterns
- [ ] Consider read replicas for heavy read workloads

## Security Best Practices

- [ ] Use Google Cloud Secret Manager for sensitive data
- [ ] Regularly rotate database credentials and secrets
- [ ] Keep Docker base images updated
- [ ] Monitor for security vulnerabilities
- [ ] Implement proper CORS policies
- [ ] Use HTTPS everywhere
- [ ] Implement rate limiting for API endpoints
- [ ] Regular security audits of dependencies

## Monitoring and Maintenance

- [ ] Set up Cloud Monitoring alerts
- [ ] Configure error reporting
- [ ] Implement application-level logging
- [ ] Monitor database performance
- [ ] Set up uptime monitoring
- [ ] Plan for regular dependency updates
- [ ] Backup strategy for database

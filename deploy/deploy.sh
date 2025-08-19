#!/bin/bash

# Finances Next - Manual Deployment Script
# This script deploys the application to Google Cloud Run

set -e  # Exit on any error

# Configuration
PROJECT_ID="your-project-id"  # Update this with your project ID
SERVICE_NAME="finances-next"
REGION="us-central1"
IMAGE_NAME="us-central1-docker.pkg.dev/$PROJECT_ID/finances-next/finances-next"

echo "🚀 Starting deployment of Finances Next to Google Cloud Run"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if project ID is set
if [ "$PROJECT_ID" == "your-project-id" ]; then
    echo -e "${RED}❌ Please update PROJECT_ID in this script with your actual project ID${NC}"
    exit 1
fi

# Verify we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Set the current project
echo -e "${YELLOW}📋 Setting Google Cloud project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Check if Artifact Registry repository exists, create if not
echo -e "${YELLOW}🏗️  Checking Artifact Registry repository...${NC}"
if ! gcloud artifacts repositories describe finances-next --location=$REGION >/dev/null 2>&1; then
    echo -e "${YELLOW}📦 Creating Artifact Registry repository...${NC}"
    gcloud artifacts repositories create finances-next \
        --repository-format=docker \
        --location=$REGION \
        --description="Finances Next Docker repository"
else
    echo -e "${GREEN}✅ Artifact Registry repository already exists${NC}"
fi

# Configure Docker to use gcloud as a credential helper
echo -e "${YELLOW}🔐 Configuring Docker authentication...${NC}"
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build the Docker image
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker build -f deploy/Dockerfile.production -t $IMAGE_NAME:latest .

# Tag with commit SHA if available
if command -v git &> /dev/null && git rev-parse --git-dir > /dev/null 2>&1; then
    COMMIT_SHA=$(git rev-parse --short HEAD)
    docker tag $IMAGE_NAME:latest $IMAGE_NAME:$COMMIT_SHA
    echo -e "${GREEN}✅ Tagged image with commit SHA: $COMMIT_SHA${NC}"
fi

# Push the image to Artifact Registry
echo -e "${YELLOW}📤 Pushing image to Artifact Registry...${NC}"
docker push $IMAGE_NAME:latest

if [ ! -z "$COMMIT_SHA" ]; then
    docker push $IMAGE_NAME:$COMMIT_SHA
fi

# Deploy to Cloud Run
echo -e "${YELLOW}🚀 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME:latest \
    --region $REGION \
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
    --set-secrets DB_URL=DB_URL:latest,DB_NAME=DB_NAME:latest,JWT_SECRET=JWT_SECRET:latest

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo -e "${GREEN}📱 Service URL: $SERVICE_URL${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Visit $SERVICE_URL to test your application"
echo "2. Update your OAuth redirect URIs to include: $SERVICE_URL/api/auth/callback/google"
echo "3. Update NEXTAUTH_URL secret if this is your first deployment:"
echo "   echo -n '$SERVICE_URL' | gcloud secrets versions add NEXTAUTH_URL --data-file=-"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"

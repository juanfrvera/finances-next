#!/bin/bash

# AWS Lambda Deployment Script for Finances Next.js Dashboard
# Usage: ./deploy.sh [stack-name] [environment] [architecture]

set -e

STACK_NAME=${1:-finances-next-lambda}
ENVIRONMENT=${2:-prod}
ARCHITECTURE=${3:-single}  # single or multi
REGION=${AWS_DEFAULT_REGION:-us-east-1}

echo "🚀 Deploying Finances Dashboard to AWS Lambda"
echo "Stack Name: ${STACK_NAME}"
echo "Environment: ${ENVIRONMENT}"
echo "Architecture: ${ARCHITECTURE}"
echo "Region: ${REGION}"

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first."
    exit 1
fi

# Function to wait for stack completion
wait_for_stack() {
    local stack_name=$1
    local operation=$2
    
    echo "⏳ Waiting for stack ${operation} to complete..."
    aws cloudformation wait stack-${operation}-complete --stack-name "${stack_name}" --region "${REGION}"
    
    if [ $? -eq 0 ]; then
        echo "✅ Stack ${operation} completed successfully!"
    else
        echo "❌ Stack ${operation} failed!"
        aws cloudformation describe-stack-events --stack-name "${stack_name}" --region "${REGION}" --max-items 10
        exit 1
    fi
}

# Function to get stack outputs
get_stack_outputs() {
    local stack_name=$1
    echo "📋 Stack Outputs:"
    aws cloudformation describe-stacks \
        --stack-name "${stack_name}" \
        --region "${REGION}" \
        --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
        --output table
}

# Function to upload static assets
upload_static_assets() {
    local stack_name=$1
    
    echo "📦 Building Next.js application..."
    npm run build
    
    # Get S3 bucket name from CloudFormation outputs
    local bucket_name=$(aws cloudformation describe-stacks \
        --stack-name "${stack_name}" \
        --region "${REGION}" \
        --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucket`].OutputValue' \
        --output text 2>/dev/null)
    
    if [ -n "$bucket_name" ] && [ -d ".next/static" ]; then
        echo "📤 Uploading static assets to S3..."
        
        # Upload Next.js static assets
        aws s3 sync .next/static s3://$bucket_name/_next/static/ \
            --cache-control "public, max-age=31536000, immutable" \
            --region "${REGION}"
        
        # Upload public assets (excluding HTML files)
        if [ -d "public" ]; then
            aws s3 sync public s3://$bucket_name/ \
                --exclude "*.html" \
                --cache-control "public, max-age=86400" \
                --region "${REGION}"
        fi
        
        echo "✅ Static assets uploaded successfully!"
    else
        echo "⚠️  Could not upload static assets. Build the app first or check bucket name."
    fi
}

echo "⚡ Deploying with AWS Lambda (${ARCHITECTURE} architecture)..."

# Select the appropriate template
if [ "$ARCHITECTURE" = "multi" ]; then
    TEMPLATE_FILE="aws-cloudformation/multi-lambda-deployment.yaml"
    echo "📋 Using multi-Lambda architecture for better cold start performance"
else
    TEMPLATE_FILE="aws-cloudformation/lambda-serverless-deployment.yaml"
    echo "📋 Using single Lambda architecture for simplicity"
fi

# Prompt for required parameters
read -s -p "Enter MongoDB Connection String: " MONGODB_URI
echo
read -p "Enter Custom Domain Name (optional, press Enter to skip): " DOMAIN_NAME
read -p "Enter SSL Certificate ARN (optional, press Enter to skip): " CERT_ARN

# Cold start optimization question
read -p "Enable cold start optimization (warming + provisioned concurrency)? [y/N]: " ENABLE_WARMING
ENABLE_WARMING=${ENABLE_WARMING:-n}

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "${STACK_NAME}" --region "${REGION}" > /dev/null 2>&1; then
    echo "� Stack exists, updating..."
    OPERATION="update"
    AWS_COMMAND="update-stack"
else
    echo "🆕 Creating new stack..."
    OPERATION="create"
    AWS_COMMAND="create-stack"
fi

# Deploy or update CloudFormation stack
aws cloudformation $AWS_COMMAND \
    --stack-name "${STACK_NAME}" \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
        ParameterKey=MongoDBConnectionString,ParameterValue="${MONGODB_URI}" \
        ParameterKey=Environment,ParameterValue="${ENVIRONMENT}" \
        ParameterKey=DomainName,ParameterValue="${DOMAIN_NAME}" \
        ParameterKey=CertificateArn,ParameterValue="${CERT_ARN}" \
    --capabilities CAPABILITY_IAM \
    --region "${REGION}"

wait_for_stack "${STACK_NAME}" "${OPERATION}"

# Deploy warming infrastructure if requested
if [[ "$ENABLE_WARMING" =~ ^[Yy]$ ]]; then
    echo "🔥 Deploying cold start optimization..."
    
    # Determine Lambda function name based on architecture
    if [ "$ARCHITECTURE" = "multi" ]; then
        PAGES_LAMBDA_NAME="${STACK_NAME}-pages-function"
        API_LAMBDA_NAME="${STACK_NAME}-api-function"
        
        # Warm the pages Lambda (most critical for user experience)
        aws cloudformation create-stack \
            --stack-name "${STACK_NAME}-warming" \
            --template-body file://aws-cloudformation/lambda-warming.yaml \
            --parameters \
                ParameterKey=LambdaFunctionName,ParameterValue="${PAGES_LAMBDA_NAME}" \
                ParameterKey=WarmingSchedule,ParameterValue="rate(5 minutes)" \
                ParameterKey=ProvisionedConcurrency,ParameterValue=1 \
            --capabilities CAPABILITY_IAM \
            --region "${REGION}" 2>/dev/null || echo "⚠️  Warming stack may already exist"
    else
        LAMBDA_NAME="${STACK_NAME}-nextjs-function"
        
        aws cloudformation create-stack \
            --stack-name "${STACK_NAME}-warming" \
            --template-body file://aws-cloudformation/lambda-warming.yaml \
            --parameters \
                ParameterKey=LambdaFunctionName,ParameterValue="${LAMBDA_NAME}" \
                ParameterKey=WarmingSchedule,ParameterValue="rate(5 minutes)" \
                ParameterKey=ProvisionedConcurrency,ParameterValue=1 \
            --capabilities CAPABILITY_IAM \
            --region "${REGION}" 2>/dev/null || echo "⚠️  Warming stack may already exist"
    fi
    
    echo "✅ Cold start optimization deployed!"
fi

# Upload static assets after stack deployment
upload_static_assets "${STACK_NAME}"

# Display outputs
get_stack_outputs "${STACK_NAME}"

# Get and display the application URLs
echo ""
echo "🌐 Your application URLs:"

CLOUDFRONT_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text 2>/dev/null)

API_URL=$(aws cloudformation describe-stacks \
    --stack-name "${STACK_NAME}" \
    --region "${REGION}" \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -n "$CLOUDFRONT_URL" ]; then
    echo "🚀 CloudFront URL (Primary): https://$CLOUDFRONT_URL"
fi

if [ -n "$API_URL" ]; then
    echo "⚡ API Gateway URL (Direct): $API_URL"
fi

if [ -n "$DOMAIN_NAME" ]; then
    echo "🌍 Custom Domain: https://$DOMAIN_NAME"
    echo "   (Make sure to point your DNS to CloudFront)"
fi

echo ""
echo "📊 Next Steps:"
echo "1. Monitor your application at the CloudFront URL above"
if [ "$ARCHITECTURE" = "multi" ]; then
    echo "2. Check CloudWatch logs:"
    echo "   - Pages: /aws/lambda/${STACK_NAME}-pages-function"
    echo "   - API: /aws/lambda/${STACK_NAME}-api-function"
    echo "   - Auth: /aws/lambda/${STACK_NAME}-auth-function"
else
    echo "2. Check CloudWatch logs: /aws/lambda/${STACK_NAME}-nextjs-function"
fi
echo "3. Set up monitoring and alerts in CloudWatch"
echo "4. Deploy your Next.js application code to the Lambda function(s)"

if [[ "$ENABLE_WARMING" =~ ^[Yy]$ ]]; then
    echo "5. Monitor cold start metrics in CloudWatch Dashboard"
    echo "6. Adjust provisioned concurrency based on traffic patterns"
fi

echo ""
echo "🎉 Deployment completed successfully!"
if [ "$ARCHITECTURE" = "multi" ]; then
    echo "🏗️  Multi-Lambda architecture provides:"
    echo "   - Faster cold starts (smaller bundles)"
    echo "   - Independent scaling per function type"
    echo "   - Specialized configurations"
else
    echo "⚡ Single Lambda architecture provides:"
    echo "   - Simpler management and debugging"
    echo "   - Shared connection pools"
    echo "   - Lower infrastructure complexity"
fi

if [[ ! "$ENABLE_WARMING" =~ ^[Yy]$ ]]; then
    echo "💡 Tip: Enable warming for production to eliminate cold starts"
    echo "   Run: ./deploy.sh ${STACK_NAME} ${ENVIRONMENT} ${ARCHITECTURE}"
    echo "   Then choose 'y' for warming when prompted"
fi

echo "📚 Check the README.md for optimization and troubleshooting tips."

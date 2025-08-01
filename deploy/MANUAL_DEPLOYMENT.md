# Manual AWS Deployment Guide

This guide helps you deploy the Finance Dashboard manually using AWS CLI instead of GitHub Actions.

## Prerequisites

You need an AWS CLI user with the proper permissions to deploy the application.

## Step 1: Set Up AWS CLI User Permissions

### 1.1 Create or Update IAM Policy

1. **Go to AWS IAM Console** → Policies
2. **Create a new policy** (or update existing one) for your AWS CLI user
3. **Choose JSON tab** and paste the policy from: `deploy/aws-cli-policy.json`

### 1.2 Attach Policy to Your AWS CLI User

1. **Go to IAM** → Users → Find your AWS CLI user (e.g., `aws-cli`)
2. **Permissions tab** → Add permissions → Attach existing policies directly
3. **Select the policy** you created above
4. **Review and attach**

## Step 2: Verify AWS CLI Configuration

Make sure your AWS CLI is configured with the user that has the policy attached:

```bash
# Check current AWS user
aws sts get-caller-identity

# Verify region is set to us-east-1
aws configure list
```

## Step 3: Manual Deployment Steps

Once your AWS CLI user has the proper permissions, follow these steps to deploy manually:

### 3.1 Create ECR Repository

```bash
# Create ECR repository for container images
aws ecr create-repository --repository-name finances-next --region us-east-1
```

### 3.2 Build and Push Docker Image

```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 485917634060.dkr.ecr.us-east-1.amazonaws.com

# Build Docker image
docker build -f deploy/Dockerfile -t finances-next .

# Tag image for ECR
docker tag finances-next:latest 485917634060.dkr.ecr.us-east-1.amazonaws.com/finances-next:latest

# Push image to ECR
docker push 485917634060.dkr.ecr.us-east-1.amazonaws.com/finances-next:latest
```

### 3.3 Deploy CloudFormation Stack

```bash
# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file deploy/cloudformation-template.yaml \
  --stack-name finances-next-prod \
  --parameter-overrides \
    ContainerImageUri="485917634060.dkr.ecr.us-east-1.amazonaws.com/finances-next:latest" \
    DBUrl="your-mongodb-connection-string" \
    DBName="your-database-name" \
    Environment="prod" \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 3.4 Get Deployment URLs

```bash
# Get API Gateway URL
aws cloudformation describe-stacks \
  --stack-name finances-next-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text

# Get CloudFront URL (if available)
aws cloudformation describe-stacks \
  --stack-name finances-next-prod \
  --region us-east-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontUrl`].OutputValue' \
  --output text
```

## Important Notes

- This policy grants broad permissions for deployment purposes
- For production environments, consider using more restrictive policies
- The policy includes all services needed for the complete deployment pipeline
- Make sure to use `us-east-1` region for consistency with the deployment scripts
- Replace `485917634060` with your actual AWS Account ID in the commands above

## Troubleshooting

### Common Issues

1. **ECR Repository Already Exists**: Skip step 3.1 if repository exists
2. **Docker Not Running**: Make sure Docker is running on your machine
3. **CloudFormation Stack Exists**: Use `--stack-name finances-next-prod-v2` for a new deployment
4. **Permissions Denied**: Ensure the IAM policy is attached to your AWS CLI user

### Cleanup Commands

To delete the deployment:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name finances-next-prod --region us-east-1

# Delete ECR repository (optional)
aws ecr delete-repository --repository-name finances-next --force --region us-east-1
```

## Next Steps

After successful deployment:

1. **Test your application** using the API Gateway or CloudFront URLs
2. **Monitor logs** in CloudWatch for any issues
3. **Set up custom domain** if needed (see main DEPLOYMENT_GUIDE.md)
4. **Configure monitoring** and alerts for production use

# GitHub Actions Deployment Setup

## Overview

Deploy your Next.js finance application to AWS Lambda directly from GitHub without installing anything locally. GitHub Actions handles everything automatically.

## 🚀 Quick Setup

### 1. GitHub Environments & Secrets

First, create two environments in your GitHub repository:

**Step 1: Create Environments**
1. Go to your GitHub repository → **Settings** → **Environments**
2. Click **New environment** and create: `staging`
3. Click **New environment** and create: `production`

**Step 2: Add Environment-Specific Secrets**

For **Staging Environment**, add these secrets:
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/your-staging-db
NEXTAUTH_SECRET=staging-secret-key-minimum-32-characters
NEXTAUTH_URL=https://staging.your-domain.com
```

For **Production Environment**, add these secrets:
```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/your-production-db
NEXTAUTH_SECRET=production-secret-key-different-from-staging
NEXTAUTH_URL=https://your-domain.com
```

> **Important**: Use different database names and secrets for complete isolation!

### 2. AWS IAM User

**Option 1: Quick Setup (Broad Permissions)**
Create an IAM user with these managed policies:
- `AWSLambdaFullAccess` - Create and manage Lambda functions
- `AmazonAPIGatewayFullAccess` - Create API Gateway for routing
- `AmazonS3FullAccess` - Create S3 bucket for static assets
- `CloudFrontFullAccess` - Create CDN distribution
- `AWSCloudFormationFullAccess` - Deploy infrastructure templates
- `IAMFullAccess` - Create Lambda execution roles

**Option 2: Security-Focused Setup (Recommended)**
Create a custom IAM policy with minimal required permissions:

**Step-by-Step Instructions:**

1. **Go to AWS Console** → **IAM** → **Policies** → **Create Policy**

2. **Select JSON tab** and paste this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "s3:*",
        "cloudfront:*",
        "cloudformation:*",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:GetRole",
        "iam:ListRolePolicies",
        "iam:ListAttachedRolePolicies",
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::*:role/*LambdaExecutionRole*",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "lambda.amazonaws.com"
        }
      }
    }
  ]
}
```

3. **Click "Next: Tags"** (optional, you can skip tags)

4. **Click "Next: Review"**

5. **Name your policy**: `NextJSLambdaDeploymentPolicy`

6. **Add description**: `Custom policy for deploying Next.js applications to AWS Lambda via GitHub Actions`

7. **Click "Create Policy"**

8. **Create IAM User**:
   - Go to **IAM** → **Users** → **Create User**
   - Name: `github-actions-nextjs-deploy`
   - Select **Programmatic access** (not console access)
   - Click **Next: Permissions**

9. **Attach your custom policy**:
   - Click **Attach existing policies directly**
   - Search for `NextJSLambdaDeploymentPolicy`
   - Check the box next to it
   - Click **Next: Tags** → **Next: Review** → **Create User**

10. **Save credentials**:
    - Copy the **Access Key ID** and **Secret Access Key**
    - Add these to your GitHub Environment secrets

**Why each permission is needed:**
- **Lambda**: Create and manage your Next.js function
- **API Gateway**: Route web requests to Lambda
- **S3**: Store static assets (CSS, JS, images)
- **CloudFront**: Global CDN for fast loading
- **CloudFormation**: Deploy infrastructure as code
- **IAM (limited)**: Create Lambda execution role only
- **Logs**: Create CloudWatch logs for debugging

### 3. Deploy

Push to the `main` branch or manually trigger the deployment:

```bash
git add .
git commit -m "Deploy to AWS Lambda"
git push origin main
```

## 📁 GitHub Actions Workflows

### 1. `deploy.yml` - Main Deployment
- **Trigger**: Push to `main` branch or manual dispatch
- **Features**:
  - Builds Next.js application
  - Creates Lambda package
  - Deploys CloudFormation stack
  - Updates Lambda code
  - Tests deployment

### 2. `cleanup.yml` - Cleanup & Rollback
- **Trigger**: Manual dispatch only
- **Features**:
  - Cleanup staging environments
  - Rollback to previous version
  - Delete stacks completely

### 3. `environment.yml` - Environment Management
- **Trigger**: Manual dispatch only
- **Features**:
  - Create staging environments
  - Update Lambda secrets
  - Scale Lambda memory/timeout

## 🎯 Deployment Options

### Automatic Deployment
```yaml
# Deploys automatically when you push to main
push:
  branches: [ main ]
```

## 🎯 Environment Strategy

### Why GitHub Environments?

**Complete Isolation:**
- ✅ **Separate databases** - staging uses your staging database, production uses your production database
- ✅ **Different secrets** - staging and production have isolated credentials
- ✅ **Protection rules** - production can require manual approval
- ✅ **Environment-specific URLs** - staging.your-domain.com vs your-domain.com

**Deployment Flow:**
1. **Staging**: Test changes with staging database and secrets
2. **Production**: Deploy to live environment with production database

### Manual Deployment
1. Go to Actions tab in your repository
2. Select "Deploy to AWS Lambda"
3. Click "Run workflow"
4. Choose environment (staging/prod)

## 🔧 Workflow Features

### Build Process
```yaml
- Build Next.js application
- Create optimized Lambda package
- Install production dependencies only
- Generate deployment ZIP
```

### Deployment Process
```yaml
- Deploy CloudFormation infrastructure
- Update Lambda function code
- Test deployment endpoint
- Generate deployment summary
```

### Monitoring
```yaml
- Deployment status in GitHub Actions
- CloudWatch logs automatically created
- Performance metrics tracked
- Error reporting in workflow summary
```

## 📊 Deployment Environments

### Production
- **Stack**: `finances-app-prod`
- **Trigger**: Push to `main`
- **URL**: API Gateway + CloudFront

### Staging
- **Stack**: `finances-app-staging`
- **Trigger**: Manual dispatch (Environment Management workflow)
- **URL**: API Gateway only

## 🛠️ Management Commands

### Manual Deployment
```bash
# Go to GitHub Actions → Deploy to AWS Lambda → Run workflow
# Select environment (staging/prod)
```

### Rollback
```bash
# Go to GitHub Actions → Cleanup and Rollback → Run workflow
# Select "rollback-prod" action
```

### Environment Management
```bash
# Go to GitHub Actions → Environment Management → Run workflow
# Create staging or scale Lambda
```

### Cleanup
```bash
# Go to GitHub Actions → Cleanup and Rollback → Run workflow
# Select "delete-stack" action
```

## 📈 Cost Optimization

### Default Configuration (Lowest Cost)
Your Lambda uses a single, cost-optimized function that handles everything:
- **Memory**: 512MB (minimum)
- **Timeout**: 15 seconds (minimum)
- **Architecture**: Single Lambda (pages + API routes + auth)

### Scaling Strategy
Start small and scale up only when needed:

1. **Monitor Performance**: Check if your app runs well with default settings
2. **Scale Memory**: If slow, increase memory (which also increases CPU)
3. **Scale Timeout**: If you get timeouts, increase the timeout duration
4. **Monitor Costs**: AWS provides detailed billing for Lambda usage

### When to Scale Up

**Increase Memory (512MB → 1024MB → 2048MB):**
- App feels slow or laggy
- Database queries take too long
- Complex calculations timeout

**Increase Timeout (15s → 30s → 60s):**
- Getting timeout errors
- Large data processing operations
- Complex database migrations

### Scaling Commands
```bash
# Use the scale-lambda action in Environment Management workflow
# Select higher memory/timeout values as needed
```

### Cost Impact
- **Memory**: Directly affects cost per millisecond
- **Timeout**: Maximum cost per request (most requests finish much faster)
- **Requests**: Pay per request, so optimize your code efficiency

### Workflow Optimization
- **Caching**: Node.js dependencies cached
- **Conditional Jobs**: Only run when needed
- **Efficient Builds**: Production-only dependencies

### Lambda Optimization
- **Memory**: Starts at 512MB (lowest cost)
- **Timeout**: Starts at 15s (minimum)
- **Cold Start**: Minimized bundle size
- **Scale on Demand**: Use environment management to increase when needed

## 🔍 Monitoring & Debugging

### GitHub Actions Logs
- Real-time deployment progress
- Detailed error messages
- Deployment summaries

### AWS CloudWatch
- Lambda execution logs
- Performance metrics
- Error tracking

### Deployment Status
```bash
# Check deployment status
https://github.com/your-username/finances-next/actions

# View CloudWatch logs
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Ffinances-app-prod-nextjs-function
```

## 🚨 Troubleshooting

### Common Issues

1. **Deployment Fails**
   - Check GitHub secrets are set correctly
   - Verify AWS permissions
   - Review CloudFormation template

2. **Lambda Timeout**
   - Increase timeout in workflow
   - Optimize application code
   - Check database connection

3. **Memory Issues**
   - Increase Lambda memory
   - Optimize dependencies
   - Check database queries

### Debug Steps
```bash
# 1. Check workflow logs in GitHub Actions
# 2. Check CloudWatch logs for Lambda
# 3. Verify CloudFormation stack status
# 4. Test API Gateway endpoint manually
```

## 🔒 Security

### Secrets Management
- All sensitive data in GitHub Secrets
- Environment variables encrypted
- IAM roles with least privilege

### Network Security
- HTTPS only through CloudFront
- API Gateway with throttling
- Lambda in VPC (optional)

## 🎉 Benefits

### No Local Setup Required
- ✅ No AWS CLI installation
- ✅ No local environment setup
- ✅ Works from any machine
- ✅ Team collaboration ready

### Automated Pipeline
- ✅ Continuous deployment
- ✅ Automated testing
- ✅ Rollback capabilities
- ✅ Environment management

### Cost Effective
- ✅ Pay per deployment
- ✅ No dedicated servers
- ✅ Efficient resource usage
- ✅ Automatic scaling

## 📚 Next Steps

1. **Set up GitHub secrets**
2. **Push to main branch**
3. **Monitor deployment**
4. **Set up custom domain**
5. **Configure monitoring alerts**

Your application will be deployed automatically without any local setup! 🚀

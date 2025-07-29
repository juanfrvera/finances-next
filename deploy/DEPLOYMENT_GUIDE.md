# Complete AWS Lambda Deployment Guide

Deploy your Next.js Finance Dashboard to AWS Lambda using Docker containers and GitHub Actions.

## Overview

**What this deployment sets up:**
- ✅ **Automatic deployment** when you push to main branch
- ✅ **Docker containerized** Lambda function (up to 10GB vs 250MB ZIP limit)
- ✅ **AWS ECR** for container storage
- ✅ **CloudFormation** for infrastructure management
- ✅ **CloudFront CDN** for fast global access
- ✅ **S3** for static assets
- ✅ **API Gateway** for HTTP routing

**Deployment files (all in `/deploy` folder):**
- 📄 `DEPLOYMENT_GUIDE.md` - This comprehensive guide
- 🐳 `Dockerfile` - Container configuration for Lambda
- ☁️ `cloudformation-template.yaml` - AWS infrastructure as code
- ⚡ `lambda-handler-optimized.js` - Dependency-free Lambda handler

## Architecture

```
GitHub → GitHub Actions → Docker Build → ECR → Lambda Container → API Gateway → CloudFront
```

**Benefits of container approach:**
- ✅ **Full Node.js environment** in Lambda
- ✅ **Better dependency management**
- ✅ **Easier local testing** (same container)
- ✅ **More flexible** than ZIP deployments

---

## Step 1: AWS Account Setup

### 1.1 Create IAM User for GitHub Actions

1. **Go to AWS IAM Console** → Users → Create User
2. **User name:** `github-actions-deployer`
3. **Access type:** Programmatic access only

### 1.2 Create Custom IAM Policy

1. **Go to IAM** → Policies → Create Policy
2. **Choose JSON tab** and paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateStack",
                "cloudformation:UpdateStack",
                "cloudformation:DeleteStack",
                "cloudformation:DescribeStacks",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResource",
                "cloudformation:DescribeStackResources",
                "cloudformation:GetTemplate",
                "cloudformation:GetTemplateSummary",
                "cloudformation:ListStackResources",
                "cloudformation:ValidateTemplate",
                "cloudformation:CreateChangeSet",
                "cloudformation:DeleteChangeSet",
                "cloudformation:DescribeChangeSet",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:ListChangeSets"
            ],
            "Resource": [
                "arn:aws:cloudformation:*:*:stack/finances-next-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:DescribeRepositories",
                "ecr:CreateRepository",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:GetFunction",
                "lambda:DeleteFunction",
                "lambda:AddPermission",
                "lambda:RemovePermission",
                "lambda:InvokeFunction",
                "lambda:TagResource",
                "lambda:UntagResource"
            ],
            "Resource": [
                "arn:aws:lambda:*:*:function:finances-next-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "apigateway:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:CreateBucket",
                "s3:DeleteBucket",
                "s3:GetBucketLocation",
                "s3:GetBucketVersioning",
                "s3:PutBucketVersioning",
                "s3:GetBucketCORS",
                "s3:PutBucketCORS",
                "s3:GetBucketWebsite",
                "s3:PutBucketWebsite",
                "s3:DeleteBucketWebsite",
                "s3:GetBucketPublicAccessBlock",
                "s3:PutBucketPublicAccessBlock",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::finances-next-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetBucketPolicy",
                "s3:PutBucketPolicy",
                "s3:DeleteBucketPolicy",
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": [
                "arn:aws:s3:::finances-next-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateDistribution",
                "cloudfront:GetDistribution",
                "cloudfront:UpdateDistribution",
                "cloudfront:DeleteDistribution",
                "cloudfront:CreateOriginAccessControl",
                "cloudfront:GetOriginAccessControl",
                "cloudfront:UpdateOriginAccessControl",
                "cloudfront:DeleteOriginAccessControl",
                "cloudfront:CreateCloudFrontOriginAccessIdentity",
                "cloudfront:GetCloudFrontOriginAccessIdentity",
                "cloudfront:UpdateCloudFrontOriginAccessIdentity",
                "cloudfront:DeleteCloudFrontOriginAccessIdentity",
                "cloudfront:TagResource",
                "cloudfront:UntagResource",
                "cloudfront:ListTagsForResource"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:CreateRole",
                "iam:GetRole",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PutRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:GetRolePolicy",
                "iam:TagRole",
                "iam:UntagRole",
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::*:role/finances-next-*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:DeleteLogGroup",
                "logs:DescribeLogGroups",
                "logs:TagLogGroup",
                "logs:UntagLogGroup"
            ],
            "Resource": [
                "arn:aws:logs:*:*:log-group:/aws/lambda/finances-next-*"
            ]
        }
    ]
}
```

3. **Policy name:** `GitHubActionsContainerDeployPolicy`
4. **Description:** `Policy for GitHub Actions to deploy containerized finance app to Lambda`

### 1.3 Attach Policy to User and Get Access Keys

1. **Attach policy** to the `github-actions-deployer` user
2. **Create access keys** and save them securely

---

## Step 2: GitHub Repository Setup

### 2.1 Add Repository Secrets

**Go to Settings** → Secrets and Variables → Actions → New Repository Secret

Add these **4 required secrets:**

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | Your AWS Access Key ID | `AKIA1234567890EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | Your AWS Secret Access Key | `abcd1234/ExampleSecretKey/NotReal+Example` |
| `DB_URL` | Your database connection URL | `mongodb+srv://username:password@your-cluster.mongodb.net/?retryWrites=true&w=majority` |
| `DB_NAME` | Your database name | `your-database-name` |

### 2.2 Verify GitHub Actions Workflow

The deployment workflow is already configured in `.github/workflows/deploy.yml` and will:
1. **Build Docker image** from `deploy/Dockerfile`
2. **Push to AWS ECR**
3. **Deploy via CloudFormation** using `deploy/cloudformation-template.yaml`
4. **Test the deployment**

---

## Step 3: Deploy Your Application

### 3.1 Deploy via Git Push (Recommended)

```bash
git add .
git commit -m "Deploy to AWS Lambda"
git push origin main
```

### 3.2 Manual Deploy via GitHub Actions

1. **Go to Actions tab** in your GitHub repository
2. **Click "Deploy to AWS Lambda"**
3. **Click "Run workflow"**
4. **Choose environment** (dev/prod)
5. **Click "Run workflow"**

---

## Step 4: Monitor Deployment

### 4.1 Track Progress

1. **GitHub Actions tab** → Watch workflow progress
2. **Deployment takes 5-8 minutes** typically
3. **Get URL from workflow summary** when complete

### 4.2 Test Your Deployment

After deployment completes, test your application:

```bash
# Get the CloudFront URL from GitHub Actions output
curl -I https://your-cloudfront-url.cloudfront.net

# Test API endpoint
curl -I https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

---

## Step 5: Post-Deployment

### 5.1 Monitor Application

- **CloudWatch Logs:** Monitor Lambda execution logs
- **CloudWatch Metrics:** Track performance and errors  
- **CloudFront:** Monitor cache hit ratio and global performance

### 5.2 Check Deployment Status

```bash
# View stack in AWS Console
aws cloudformation describe-stacks --stack-name finances-next-prod

# Check Lambda function
aws lambda get-function --function-name finances-next-prod-nextjs-function
```

---

## Troubleshooting

### Common Issues

1. **Cold Start:** First request takes 1-3 seconds (normal for Lambda)
2. **GitHub Actions Fails:** Check AWS credentials and permissions
3. **ECR Push Fails:** Verify IAM policy includes ECR permissions
4. **Stack Creation Fails:** Check CloudFormation events in AWS Console

### Debug Commands

```bash
# Follow Lambda logs
aws logs tail /aws/lambda/finances-next-prod-nextjs-function --follow

# Check CloudFormation stack events
aws cloudformation describe-stack-events --stack-name finances-next-prod

# Test MongoDB connection
# (Add test endpoint in your app for this)
```

### Performance Tuning

- **Memory:** Increase Lambda memory (512MB → 1024MB) for better performance
- **Timeout:** Increase if operations take longer than 15 seconds
- **CloudFront:** Verify caching is working for static assets

---

## Cost Estimation

**Monthly costs for typical usage:**
- **Lambda:** $5-15/month (depends on requests)
- **API Gateway:** $3-10/month  
- **CloudFront:** $1-5/month
- **S3:** $1-3/month
- **GitHub Actions:** Free (2,000 minutes/month)
- **ECR:** $1-2/month
- **Total:** ~$11-37/month

**Much cheaper than EC2 instances for moderate traffic!**

---

## Cleanup Resources

To delete all AWS resources:

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name finances-next-prod

# Delete ECR repository (optional)
aws ecr delete-repository --repository-name finances-next --force
```

---

## Next Steps

1. **Custom Domain:** Set up Route 53 and SSL certificate
2. **Monitoring:** Set up CloudWatch alarms for errors
3. **Security:** Review and tighten IAM permissions
4. **Backup:** Configure MongoDB backup strategy
5. **Environments:** Create separate dev/staging stacks

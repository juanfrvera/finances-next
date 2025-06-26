# AWS Lambda Deployment Guide

## 🚀 Quick Deployment

Deploy your Next.js financial dashboard to AWS Lambda with one command:

```bash
./deploy.sh
```

**What you get:**
- Serverless Next.js app on AWS Lambda
- CloudFront CDN for global performance
- S3 for static assets
- HTTP API Gateway V2
- ~$5-15/month cost for typical usage

## 📋 Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] MongoDB Atlas connection string ready
- [ ] Node.js and npm installed
- [ ] Basic understanding of serverless limitations

## 🔧 Pre-deployment Setup

### 1. Install AWS CLI
```bash
# Linux/macOS
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installation
aws --version
```

### 2. Configure AWS
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your Secret Access Key  
# Enter your default region (e.g., us-east-1)
# Enter output format (json)
```

### 3. Set up MongoDB Atlas
```bash
# 1. Create MongoDB Atlas cluster at https://cloud.mongodb.com
# 2. Create database user
# 3. Whitelist 0.0.0.0/0 (for Lambda) or specific AWS IP ranges
# 4. Get connection string: mongodb+srv://username:password@cluster.mongodb.net/dbname
```

## ⚡ Deployment Options

### Option 1: Quick Deploy (Recommended)
```bash
# Clone and deploy in one go
./deploy.sh

# With custom settings
./deploy.sh my-finance-app prod
```

### Option 2: Manual CloudFormation
```bash
aws cloudformation create-stack \
  --stack-name finances-next-lambda \
  --template-body file://aws-cloudformation/lambda-serverless-deployment.yaml \
  --parameters \
    ParameterKey=MongoDBConnectionString,ParameterValue="your-connection-string" \
    ParameterKey=Environment,ParameterValue=prod \
  --capabilities CAPABILITY_IAM
```

## � What Happens During Deployment

1. **Infrastructure Creation** (5-10 minutes)
   - Lambda function for Next.js SSR
   - S3 bucket for static assets
   - CloudFront distribution for CDN
   - HTTP API Gateway for routing
   - IAM roles and policies

2. **Application Build & Upload**
   - Next.js application build
   - Static assets uploaded to S3
   - Lambda function code deployment

3. **DNS & SSL Setup** (if custom domain)
   - CloudFront distribution configuration
   - SSL certificate attachment

## 📊 Architecture Overview

```
Internet → CloudFront CDN → API Gateway → Lambda (Next.js)
                        ↘ S3 (Static Assets)
```

- **CloudFront**: Global CDN, caches static assets
- **API Gateway**: Routes requests to Lambda
- **Lambda**: Runs Next.js server-side rendering
- **S3**: Hosts static files (`_next/static`, images)

## 💰 Cost Breakdown

### Typical Monthly Costs (10,000 page views)
- **Lambda**: $3-5 (execution time)
- **API Gateway**: $1-2 (requests)
- **CloudFront**: $1-3 (data transfer)
- **S3**: $0.50 (storage)
- **Total**: ~$5-10/month

### Cost Optimization
- Static assets served from S3/CloudFront (not Lambda)
- Intelligent caching reduces Lambda invocations
- Compression enabled to reduce transfer costs

## ⚡ Performance Characteristics

### Cold Starts
- **First request**: 1-3 seconds
- **Warm requests**: 50-200ms
- **Mitigation**: CloudWatch Events to keep warm

### Scalability
- **Concurrent executions**: 1,000 default (can be increased)
- **Auto-scaling**: Instant based on demand
- **Global distribution**: CloudFront edge locations

## 🔧 Post-Deployment Configuration

### 1. Verify Deployment
```bash
# Get your application URL
aws cloudformation describe-stacks \
  --stack-name finances-next-lambda \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text
```

### 2. Set up Monitoring
```bash
# View Lambda logs
aws logs tail /aws/lambda/finances-next-lambda-nextjs-function --follow
```

### 3. Custom Domain (Optional)
```bash
# 1. Get SSL certificate in us-east-1 (required for CloudFront)
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --region us-east-1

# 2. Update stack with domain
./deploy.sh your-stack-name prod
# Enter domain name when prompted
```

## 📞 Support

For issues or questions:
1. Check CloudFormation events in AWS Console
2. Review CloudWatch logs
3. Verify environment variables
4. Test MongoDB connectivity

## 🧹 Cleanup

To remove all AWS resources:
```bash
aws cloudformation delete-stack --stack-name your-stack-name
```

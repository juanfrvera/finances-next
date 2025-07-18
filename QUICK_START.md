# Quick Start Deployment Guide

## 🚀 Deployment Options

### Option 1: GitHub Actions (Recommended - Zero Setup)
Deploy directly from GitHub without installing anything locally.

**Setup (One-time):**
1. Go to your GitHub repository → Settings → Secrets
2. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key
   - `MONGODB_CONNECTION_STRING`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Your NextAuth secret key

**Deploy:**
```bash
git add .
git commit -m "Deploy to AWS Lambda"
git push origin main
```

That's it! GitHub Actions handles everything automatically. 🎉

📖 **[Complete GitHub Actions Guide](GITHUB_ACTIONS_SETUP.md)**

---

### Option 2: Local Deployment (Traditional)

**Use your existing CloudFormation template:**
```bash
# Set your environment variables
export MONGODB_CONNECTION_STRING="mongodb+srv://username:password@cluster.mongodb.net/finances"
export ENVIRONMENT="prod"

# Deploy with your existing script
chmod +x deploy.sh
./deploy.sh finances-app prod single
```

### Option 2: Multi-Lambda (Advanced)
```bash
./deploy.sh finances-app prod multi
```

### Option 3: AWS CDK (Infrastructure as Code)
```bash
# Install CDK
npm install -g aws-cdk
cdk init app --language typescript
# Then follow the CDK setup in DEPLOYMENT_GUIDE.md
```

## Prerequisites Checklist

- [ ] AWS CLI installed and configured (`aws configure`)
- [ ] Node.js 18+ installed
- [ ] MongoDB connection string ready
- [ ] (Optional) Custom domain and SSL certificate

## Environment Variables Required

Create a `.env.production` file:
```bash
DB_URL=mongodb+srv://username:password@cluster.mongodb.net/finances
DB_NAME=finances
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=https://your-domain.com
LAMBDA_ENVIRONMENT=true
```

## Quick Commands

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Deploy to AWS
export MONGODB_CONNECTION_STRING="your-mongo-connection"
./deploy.sh

# 4. Check deployment
aws cloudformation describe-stacks --stack-name finances-app-prod
```

## Costs

Expected monthly costs:
- **Lambda**: $5-15 (depends on usage)
- **API Gateway**: $3-10
- **CloudFront**: $1-5
- **S3**: $1-3
- **Total**: ~$10-35/month

## Monitoring

After deployment:
- CloudWatch Logs: `/aws/lambda/finances-app-prod-nextjs-function`
- Metrics: Lambda duration, errors, invocations
- X-Ray: Enable for request tracing

## Troubleshooting

Common issues:
1. **Cold starts**: First request takes 1-3 seconds
2. **Memory limits**: Increase Lambda memory if needed
3. **Timeout**: Increase timeout for heavy operations
4. **Bundle size**: Use `.lambdaignore` to exclude files

## Performance Optimization

1. **Enable CloudFront caching** for static assets
2. **Use Lambda warming** (included in template)
3. **Optimize bundle size** by excluding dev dependencies
4. **Enable compression** in Next.js config

## Security

- Environment variables are encrypted
- IAM roles follow least privilege
- API Gateway includes rate limiting
- CloudFront provides DDoS protection

## Next Steps

1. Deploy with default settings
2. Test the application
3. Add custom domain
4. Set up monitoring alerts
5. Configure CI/CD pipeline

## Support

Check the detailed `DEPLOYMENT_GUIDE.md` for comprehensive instructions and troubleshooting.

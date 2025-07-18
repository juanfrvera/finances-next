# AWS Lambda Deployment Guide

## 🚀 GitHub Actions Deployment (Zero Local Setup)

Deploy your Next.js finance application directly from GitHub without installing anything locally.

📖 **[Complete GitHub Actions Setup Guide](GITHUB_ACTIONS_SETUP.md)**

### Quick Start:
1. **Add AWS credentials to GitHub Secrets**
   - Go to your GitHub repository → Settings → Secrets and variables → Actions
   - Add: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `MONGODB_CONNECTION_STRING`, `NEXTAUTH_SECRET`

2. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to AWS Lambda"
   git push origin main
   ```

3. **Done! 🎉**
   - GitHub Actions automatically builds and deploys your application
   - Monitor progress in the Actions tab
   - Get deployment URL from the workflow summary

### Features:
- ✅ **Zero local setup** - Works from any machine
- ✅ **Automatic builds** - Triggered on push to main
- ✅ **Environment management** - Dev, staging, and production
- ✅ **Rollback support** - Easy revert to previous versions
- ✅ **Cost effective** - Pay only for actual usage
- ✅ **Team collaboration** - Everyone can deploy safely

### Manual Deployment Options:
- **Actions Tab** → "Deploy to AWS Lambda" → Run workflow
- **Choose environment**: dev, prod
- **Choose architecture**: single lambda, multi lambda

## Costs Estimation

For a typical finance app:
- **Lambda**: $5-15/month (depends on usage)
- **API Gateway**: $3-10/month
- **CloudFront**: $1-5/month
- **S3**: $1-3/month
- **GitHub Actions**: Free (2,000 minutes/month)
- **Total**: ~$10-35/month

Much cheaper than EC2 instances for moderate traffic!

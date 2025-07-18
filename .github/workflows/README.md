# GitHub Actions Workflows

This directory contains GitHub Actions workflows for automated deployment and management of your Next.js finance application on AWS Lambda.

## 📁 Workflows

### `deploy.yml` - Main Deployment Pipeline
- **Triggers**: Push to `main`, PR merge, manual dispatch
- **Purpose**: Build and deploy the application to AWS Lambda
- **Features**:
  - Builds Next.js application
  - Creates Lambda deployment package
  - Deploys CloudFormation infrastructure
  - Updates Lambda function code
  - Tests deployment
  - Provides deployment summary

### `cleanup.yml` - Cleanup & Rollback Operations
- **Triggers**: Manual dispatch only
- **Purpose**: Clean up environments and rollback deployments
- **Features**:
  - Cleanup staging environments
  - Rollback to previous versions
  - Delete CloudFormation stacks

### `environment.yml` - Environment Management
- **Triggers**: Manual dispatch only
- **Purpose**: Manage deployment environments
- **Features**:
  - Create dev/staging environments
  - Update Lambda environment variables
  - Scale Lambda memory and timeout
  - Environment status monitoring

## 🎯 Usage

### Automatic Deployment
Push any changes to the `main` branch:
```bash
git push origin main
```

### Manual Deployment
1. Go to GitHub Actions tab
2. Select "Deploy to AWS Lambda"
3. Click "Run workflow"
4. Choose environment and architecture

### Environment Management
1. Go to GitHub Actions tab
2. Select "Environment Management"
3. Choose the desired action
4. Configure parameters as needed

## 📊 Deployment Environments

- **Production**: `finances-app-prod`
- **Development**: `finances-app-dev`
- **Staging**: `finances-app-staging`
- **PR Preview**: `finances-app-pr-{number}`

## 🔧 Required Secrets

Add these secrets in your GitHub repository settings:

```
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/finances
NEXTAUTH_SECRET=your-super-secret-key-minimum-32-characters
NEXTAUTH_URL=https://your-domain.com
```

## 📈 Monitoring

- **GitHub Actions**: Real-time deployment logs
- **CloudWatch**: Lambda execution logs and metrics
- **Deployment Summaries**: Automatic status reports

## 🚨 Troubleshooting

1. **Check GitHub Actions logs** for deployment errors
2. **Verify GitHub secrets** are properly set
3. **Review CloudWatch logs** for runtime issues
4. **Check CloudFormation stack** status in AWS console

## 📚 Documentation

- [GitHub Actions Setup Guide](../GITHUB_ACTIONS_SETUP.md)
- [Deployment Guide](../DEPLOYMENT_GUIDE.md)
- [Quick Start](../QUICK_START.md)

## 🔒 Security

- All sensitive data stored in GitHub Secrets
- IAM roles with least privilege
- Encrypted environment variables
- Secure deployment pipeline

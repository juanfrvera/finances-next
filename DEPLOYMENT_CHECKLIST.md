# Pre-Deployment Checklist

## Required Setup
- [ ] AWS CLI installed and configured (`aws --version`)
- [ ] AWS credentials configured (`aws sts get-caller-identity`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] MongoDB connection string ready
- [ ] Environment variables set

## Environment Variables
```bash
# Required
export MONGODB_CONNECTION_STRING="mongodb+srv://username:password@cluster.mongodb.net/finances"
export NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters"

# Optional
export NEXTAUTH_URL="https://your-domain.com"
export AWS_REGION="us-east-1"
```

## Deployment Steps

### Quick Deployment (Single Lambda)
```bash
# 1. Set environment variables
export MONGODB_CONNECTION_STRING="your-mongo-connection"

# 2. Deploy
npm run deploy:prod
```

### Manual Deployment
```bash
# 1. Build the application
npm run build

# 2. Create Lambda package
npm run build:lambda

# 3. Deploy infrastructure
./deploy.sh finances-app prod single

# 4. Check deployment
npm run aws:status
npm run aws:outputs
```

## Post-Deployment

### Test the Application
```bash
# Get the API Gateway URL
npm run aws:outputs

# Test the endpoint
curl -I https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/prod
```

### Monitor Logs
```bash
# Follow Lambda logs
npm run aws:logs

# Or manually
aws logs tail /aws/lambda/finances-app-prod-nextjs-function --follow
```

### Performance Monitoring
- CloudWatch Metrics: Lambda duration, errors, invocations
- X-Ray Tracing: Enable for detailed request tracing
- CloudFront: Cache hit ratio and performance

## Troubleshooting

### Common Issues
1. **Cold Start**: First request takes 1-3 seconds (normal)
2. **Memory Issues**: Increase Lambda memory in CloudFormation
3. **Timeout**: Increase timeout for heavy operations
4. **Bundle Size**: Use Next.js bundle analyzer

### Debug Commands
```bash
# Check stack status
aws cloudformation describe-stacks --stack-name finances-app-prod

# Check Lambda function
aws lambda get-function --function-name finances-app-prod-nextjs-function

# Check recent logs
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/finances-app
```

## Cleanup

### Delete Resources
```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name finances-app-prod

# Clean local files
rm -rf lambda-package lambda-deployment.zip
```

## Next Steps

1. **Custom Domain**: Set up Route 53 and SSL certificate
2. **CI/CD Pipeline**: Automate deployment with GitHub Actions
3. **Monitoring**: Set up CloudWatch alarms
4. **Backup**: Configure MongoDB backup strategy
5. **Security**: Review IAM roles and permissions

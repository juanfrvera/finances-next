# App Runner Migration Guide

This guide covers the migration from AWS Lambda to AWS App Runner for better Next.js performance.

## Benefits of App Runner over Lambda

✅ **No Cold Starts** - Always warm, instant response times  
✅ **Better Performance** - Persistent connections, file system caching  
✅ **Simpler Architecture** - No API Gateway, direct HTTPS access  
✅ **Auto Scaling** - Scales from 1 to 10 instances based on traffic  
✅ **Cost Effective** - Pay for actual usage, not per request  

## Migration Steps

### 1. Clean Up Lambda Resources (Optional)

To avoid conflicts and extra costs, you can delete the old Lambda stack:

```bash
# Delete the Lambda CloudFormation stack
aws cloudformation delete-stack --stack-name finances-next-prod

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete --stack-name finances-next-prod
```

### 2. Deploy App Runner Service

The GitHub Actions workflow will automatically:

1. Build the Docker image optimized for App Runner
2. Push to ECR
3. Deploy the CloudFormation stack with App Runner service
4. Perform health checks

### 3. Update DNS (if using custom domain)

If you have a custom domain, update your DNS records to point to the new App Runner URL.

## Architecture Changes

### Before (Lambda)
```
Internet → CloudFront → API Gateway → Lambda → MongoDB
```

### After (App Runner)
```
Internet → App Runner → MongoDB
```

## Configuration

### Environment Variables
App Runner automatically gets these from the CloudFormation template:
- `NODE_ENV=production`
- `DB_URL` (from secrets)
- `DB_NAME` (from secrets)
- `NEXT_TELEMETRY_DISABLED=1`

### Health Check
App Runner uses `/api/health` endpoint for health monitoring.

### Auto Scaling
- **Min instances**: 1 (always warm)
- **Max instances**: 10
- **Max concurrency**: 100 requests per instance

## Monitoring

### CloudWatch Logs
App Runner automatically sends logs to CloudWatch:
```bash
# View logs
aws logs describe-log-groups --log-group-name-prefix "/aws/apprunner/"
```

### Metrics
Monitor in CloudWatch:
- Request count
- Response time
- CPU/Memory usage
- Active instances

## Cost Comparison

### Lambda (Previous)
- API Gateway: $3.50 per million requests
- Lambda: $0.20 per 1M requests + compute time
- CloudFront: $0.085 per GB

### App Runner (New)
- Compute: $0.007 per vCPU-hour + $0.001 per GB-hour
- No additional charges for requests
- Built-in load balancer included

## Rollback Plan

If issues arise, you can quickly rollback:

1. Re-enable the old Lambda stack
2. Update DNS to point back to CloudFront
3. Investigate App Runner issues

## Next Steps

After successful deployment:

1. Monitor performance and costs
2. Consider enabling auto-pause for dev environments
3. Set up custom domain with App Runner
4. Configure CI/CD for automatic deployments

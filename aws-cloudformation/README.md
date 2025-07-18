# AWS Lambda Deployment for Next.js Finances Dashboard

This directory contains an optimized CloudFormation template for deploying your Next.js Finances Dashboard to AWS Lambda with CloudFront CDN.

## Why Lambda for Next.js?

**✅ Benefits:**
- **Cost-effective**: Pay only for actual requests (often $5-15/month)
- **Auto-scaling**: Handles traffic spikes automatically
- **No server management**: Fully serverless
- **Global distribution**: CloudFront CDN included
- **Fast deployment**: Quick updates and rollbacks

**⚠️ Considerations:**
- **Cold starts**: 1-3 second delay for new instances
- **Timeout limits**: 15 minutes maximum execution
- **Memory limits**: 10GB maximum
- **Best for**: APIs, SSR pages, moderate traffic apps

## Single Lambda Architecture

Your Next.js application runs in a single Lambda function that handles:
```
CloudFront → API Gateway → Single Lambda (Entire Next.js App)
          ↘ S3 (Static Assets)
```

**Benefits:**
- ✅ **Simple deployment** - One function to manage
- ✅ **Shared resources** - Database connections, cache reused
- ✅ **Lower complexity** - Easier debugging and monitoring
- ✅ **Cost effective** - Perfect for solo development
- ✅ **Fast development** - No function coordination needed

**How it works:**
- **Pages** (`/dashboard`, `/login`) - Server-side rendered
- **API Routes** (`/api/transactions`) - Direct API responses  
- **Static Assets** - Served from S3 + CloudFront
- **Authentication** - Handled within the same function
- **Better fault isolation**

**Trade-offs:**
- More complex deployment
- Potential latency between Lambda functions
- Higher infrastructure overhead

## Deployment Options

### Single Template: `lambda-serverless-deployment.yaml`
- **Best for**: Full-stack Next.js applications
- **Cost**: ~$5-15/month for small to medium apps
- **Template**: `lambda-serverless-deployment.yaml`

## Prerequisites

1. **AWS CLI installed and configured**
   ```bash
   aws configure
   ```

2. **MongoDB Atlas or MongoDB instance**
   - Get your connection string ready
   - Ensure network access is configured for AWS Lambda IPs

3. **Node.js and npm/yarn** (for building the application)

4. **Basic understanding of Lambda limitations**
   - 15-minute timeout for long operations
   - Cold start latency considerations

## Quick Deployment

### Deploy with Single Lambda
```bash
./deploy.sh
```

### With Lambda Warming (For Production)
```bash
# Deploy single lambda
./deploy.sh

# Add warming infrastructure
aws cloudformation create-stack \
  --stack-name lambda-warming \
  --template-body file://aws-cloudformation/lambda-warming.yaml \
  --parameters \
    ParameterKey=LambdaFunctionName,ParameterValue=finances-next-lambda-nextjs-function \
    ParameterKey=WarmingSchedule,ParameterValue="rate(5 minutes)" \
    ParameterKey=ProvisionedConcurrency,ParameterValue=1 \
  --capabilities CAPABILITY_IAM
```

## Post-Deployment Steps

After the CloudFormation stack is created, you need to deploy your Next.js application:

### 1. Build your Next.js app for Lambda
```bash
# Install dependencies for Lambda packaging
npm install @vendia/serverless-express aws-lambda

# Build the application
npm run build
```

### 2. Create a Lambda-compatible handler
The template includes a placeholder. You'll need to replace it with a proper Next.js Lambda handler.

### 3. Upload static assets to S3
```bash
# Get the S3 bucket name from CloudFormation outputs
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name finances-next-lambda \
  --query 'Stacks[0].Outputs[?OutputKey==`StaticAssetsBucket`].OutputValue' \
  --output text)

# Upload static assets
aws s3 sync .next/static s3://$BUCKET_NAME/_next/static/ --cache-control "public, max-age=31536000, immutable"
aws s3 sync public s3://$BUCKET_NAME/ --exclude "*.html" --cache-control "public, max-age=86400"
```

### 4. Update Lambda function code
```bash
# Package your Lambda function (you'll need to create this)
zip -r lambda-function.zip .

# Update the Lambda function
aws lambda update-function-code \
  --function-name $(aws cloudformation describe-stacks \
    --stack-name finances-next-lambda \
    --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionName`].OutputValue' \
    --output text) \
  --zip-file fileb://lambda-function.zip
```

### 5. Access your application
```bash
# Get CloudFront URL
aws cloudformation describe-stacks \
  --stack-name finances-next-lambda \
  --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
  --output text
```

## Environment Variables

The Lambda function includes these environment variables:

- `MONGODB_URI`: Your MongoDB connection string
- `NODE_ENV`: Set to your environment (dev/staging/prod)
- `STATIC_BUCKET`: S3 bucket for static assets (auto-configured)
- `NEXT_TELEMETRY_DISABLED`: Set to `1` to disable telemetry

## Lambda-Specific Considerations

### Cold Starts
- **First request after inactivity**: 1-3 seconds
- **Subsequent requests**: 50-200ms
- **Warm-up time**: ~15 minutes of inactivity before cold start

### Cold Start Optimization Strategies

1. **Bundle Size Optimization**
   ```bash
   # Analyze bundle size
   npm run build
   npx @next/bundle-analyzer
   
   # Use dynamic imports for heavy components
   const Chart = dynamic(() => import('./Chart'), { ssr: false });
   ```

2. **Provisioned Concurrency** (Recommended for production)
   ```bash
   # Set provisioned concurrency to keep instances warm
   aws lambda put-provisioned-concurrency-config \
     --function-name your-function-name \
     --qualifier $LATEST \
     --provisioned-concurrency-count 2
   ```

3. **Warm-up Schedule**
   ```bash
   # CloudWatch Events to ping Lambda every 5 minutes
   aws events put-rule \
     --name lambda-warmer \
     --schedule-expression "rate(5 minutes)"
   ```

## Advanced Cold Start Optimization

### 1. Bundle Size Optimization
```bash
# Analyze your bundle
npm run build
npx @next/bundle-analyzer

# Next.js config optimizations
module.exports = {
  experimental: {
    outputStandalone: true,
    optimizeCss: true,
    swcMinify: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude client-only packages from server bundle
      config.externals.push('@swc/helpers', 'canvas', 'jsdom');
    }
    return config;
  },
  // Disable unnecessary features for Lambda
  images: { unoptimized: true },
  telemetry: false,
};
```

### 2. Provisioned Concurrency (Production)
Deploy warming infrastructure to eliminate cold starts:
```bash
# Deploy warming infrastructure
aws cloudformation create-stack \
  --stack-name lambda-warming \
  --template-body file://aws-cloudformation/lambda-warming.yaml \
  --parameters \
    ParameterKey=LambdaFunctionName,ParameterValue=your-lambda-name \
    ParameterKey=ProvisionedConcurrency,ParameterValue=2 \
  --capabilities CAPABILITY_IAM
```

### 3. Performance Monitoring
```bash
# Monitor cold start metrics
aws logs filter-log-events \
  --log-group-name /aws/lambda/your-function \
  --filter-pattern "Cold start" \
  --start-time $(date -d '1 hour ago' +%s)000
```

### 4. Code-Level Optimizations
- **Global variable reuse**: Initialize outside handler
- **Connection pooling**: Reuse database connections
- **Lazy loading**: Import heavy modules conditionally
- **Tree shaking**: Remove unused code

## Recommended Architecture by Use Case

### For Your Finance Dashboard:

**Single Lambda Benefits:**
- ✅ Simple personal/small business dashboard
- ✅ Perfect for solo development
- ✅ Easier debugging and deployment  
- ✅ Lower infrastructure complexity
- ✅ Cost effective for moderate traffic
- ✅ All components work together seamlessly

### Why Single Lambda Works Great:

**Performance:** Your finance app will have excellent performance with a single Lambda:
- **First visit:** ~1-3 seconds (includes cold start + page render)
- **API calls:** ~50-200ms (warm Lambda, direct database access)
- **Navigation:** ~200-500ms (server-side rendering)

**Scaling:** Perfect for personal finance management:
- Handles hundreds of concurrent users
- Automatic scaling based on traffic
- No coordination between multiple functions needed

### Memory and Timeout
- Default: 512MB memory, 15-second timeout (optimized for cost)
- Scale up using Environment Management workflow when needed
- Monitor CloudWatch metrics for optimization

### Static Assets
- Served from S3 via CloudFront
- Automatic cache headers for optimal performance
- No Lambda execution cost for static files

### Database Connections
- Use connection pooling for MongoDB
- Consider connection limits with concurrent Lambda executions
- MongoDB Atlas handles this well with proper configuration

## Cost Optimization

### Lambda Pricing
- **Requests**: $0.20 per 1M requests
- **Compute**: $0.0000166667 per GB-second
- **Example**: 10,000 requests/month ≈ $3-8/month

### Additional AWS Services
- **CloudFront**: $0.085 per GB data transfer
- **S3**: $0.023 per GB storage
- **API Gateway**: $1.00 per million requests

### Optimization Tips
1. **Optimize bundle size**: Reduce Lambda cold start time
2. **Use appropriate memory**: Balance cost vs performance
3. **Enable compression**: Reduce CloudFront costs
4. **Set proper cache headers**: Reduce Lambda invocations

## Monitoring and Logging

### CloudWatch Integration
- Lambda execution logs: `/aws/lambda/your-function-name`
- API Gateway logs: Enabled by default
- CloudFront logs: Optional (additional cost)

### Key Metrics to Monitor
- Lambda duration and memory usage
- API Gateway 4XX/5XX errors
- CloudFront cache hit ratio
- MongoDB connection errors

### Alerts Setup
```bash
# Create CloudWatch alarm for Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-Errors" \
  --alarm-description "Lambda function errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

## Security Considerations

### Lambda Security
- **IAM roles**: Least privilege access
- **VPC**: Optional, adds cold start latency
- **Environment variables**: Encrypted at rest
- **MongoDB**: Use connection string with authentication

### CloudFront Security
- **HTTPS**: Automatic redirect from HTTP
- **WAF**: Optional, additional protection
- **Origin Access Identity**: Secure S3 access
- **Security headers**: Implemented in Next.js config

### Best Practices
1. **Secrets**: Use AWS Secrets Manager for sensitive data
2. **CORS**: Properly configured in API Gateway
3. **Rate limiting**: Built into API Gateway
4. **Input validation**: Implement in your Next.js app

## Troubleshooting

### Common Issues

1. **Cold starts taking too long**
   - Reduce bundle size
   - Increase memory allocation
   - Consider provisioned concurrency

2. **Static assets not loading**
   - Check S3 bucket permissions
   - Verify CloudFront cache behaviors
   - Check file paths in your Next.js build

3. **MongoDB connection errors**
   - Verify connection string
   - Check MongoDB Atlas IP whitelist
   - Monitor connection pool limits

4. **API Gateway timeouts**
   - Increase Lambda timeout (max 15 minutes)
   - Optimize database queries
   - Implement proper error handling

### Debug Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/your-function-name --follow

# Test API Gateway endpoint
curl -v https://your-api-id.execute-api.region.amazonaws.com/prod/

# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name finances-next-lambda
```

## Cleanup

To remove all resources:
```bash
aws cloudformation delete-stack --stack-name <your-stack-name>
```

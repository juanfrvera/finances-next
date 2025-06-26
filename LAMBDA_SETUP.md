# AWS Lambda Deployment Package Creation

## Steps to create a production Lambda deployment

### 1. Install Lambda-specific dependencies
```bash
npm install @vendia/serverless-express --save
```

### 2. Create Lambda handler
Copy `lambda-handler.example.js` to `lambda-handler.js` and customize as needed.

### 3. Build for Lambda
```bash
# Build Next.js app
npm run build

# Create deployment package
mkdir lambda-package
cp -r .next/standalone/* lambda-package/
cp lambda-handler.js lambda-package/index.js
cp -r node_modules lambda-package/
cp package.json lambda-package/

# Create ZIP file
cd lambda-package
zip -r ../lambda-function.zip .
cd ..
```

### 4. Deploy to Lambda
```bash
# Update Lambda function code
aws lambda update-function-code \
  --function-name your-lambda-function-name \
  --zip-file fileb://lambda-function.zip
```

### 5. Alternative: Use AWS SAM
Create `template.yaml` for better Lambda integration:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  NextJSFunction:
    Type: AWS::Serverless::Function
    Properties:
      CodeUri: lambda-package/
      Handler: index.handler
      Runtime: nodejs18.x
      MemorySize: 1024
      Timeout: 30
      Environment:
        Variables:
          NODE_ENV: production
          MONGODB_URI: !Ref MongoDBConnectionString
```

### 6. Performance Optimization
- Use provisioned concurrency for consistent performance
- Optimize bundle size to reduce cold starts
- Enable X-Ray tracing for debugging
- Use connection pooling for MongoDB

## Notes
- Lambda has a 250MB unzipped package size limit
- Consider using Lambda Layers for large dependencies
- Monitor cold start times and optimize accordingly
- Use CloudWatch Logs for debugging

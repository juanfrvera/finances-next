# Manual AWS Deployment Guide

This guide helps you deploy the Finance Dashboard manually using AWS CLI instead of GitHub Actions.

## Prerequisites

You need an AWS CLI user with the proper permissions to deploy the application.

## Step 1: Set Up AWS CLI User Permissions

### 1.1 Create or Update IAM Policy

1. **Go to AWS IAM Console** → Policies
2. **Create a new policy** (or update existing one) for your AWS CLI user
3. **Choose JSON tab** and paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudformation:*",
                "lambda:*",
                "apigateway:*",
                "cloudfront:*",
                "s3:*",
                "iam:*",
                "logs:*",
                "ecr:*",
                "ssm:GetParameter",
                "ssm:PutParameter",
                "ssm:DeleteParameter",
                "route53:*",
                "acm:*"
            ],
            "Resource": "*"
        }
    ]
}
```

### 1.2 Attach Policy to Your AWS CLI User

1. **Go to IAM** → Users → Find your AWS CLI user (e.g., `aws-cli`)
2. **Permissions tab** → Add permissions → Attach existing policies directly
3. **Select the policy** you created above
4. **Review and attach**

## Step 2: Verify AWS CLI Configuration

Make sure your AWS CLI is configured with the user that has the policy attached:

```bash
# Check current AWS user
aws sts get-caller-identity

# Verify region is set to us-east-1
aws configure list
```

## Step 3: Manual Deployment Steps

Once your AWS CLI user has the proper permissions, you can proceed with manual deployment:

1. **Create ECR repository**
2. **Build and push Docker image**
3. **Deploy CloudFormation stack**

## Important Notes

- This policy grants broad permissions for deployment purposes
- For production environments, consider using more restrictive policies
- The policy includes all services needed for the complete deployment pipeline
- Make sure to use `us-east-1` region for consistency with the deployment scripts

## Next Steps

After setting up the policy, you can proceed with the manual deployment commands or use the GitHub Actions workflow.

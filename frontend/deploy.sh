#!/bin/bash

# Gateway DataSecure Inc. Document Upload System - Frontend Deployment Script

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if jq is installed (for parsing JSON)
if ! command -v jq &> /dev/null; then
    echo "jq is not installed. Please install it first."
    exit 1
fi

# Get stack name from user
read -p "Enter CloudFormation stack name: " STACK_NAME

# Get AWS region from user
read -p "Enter AWS region (e.g., us-east-1): " AWS_REGION

# Get frontend bucket name from CloudFormation outputs
echo "Retrieving S3 bucket name from CloudFormation stack..."
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='FrontendWebsiteURL'].OutputValue" --output text | sed 's/http:\/\///' | sed 's/\.s3-website.*//')

if [ -z "$BUCKET_NAME" ]; then
    echo "Failed to retrieve S3 bucket name from CloudFormation stack."
    exit 1
fi

echo "Retrieved S3 bucket name: $BUCKET_NAME"

# Get API Gateway endpoints from CloudFormation outputs
echo "Retrieving API Gateway endpoints from CloudFormation stack..."
DEV_API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='DevApiEndpoint'].OutputValue" --output text)
PROD_API_ENDPOINT=$(aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ProdApiEndpoint'].OutputValue" --output text)

if [ -z "$DEV_API_ENDPOINT" ] || [ -z "$PROD_API_ENDPOINT" ]; then
    echo "Failed to retrieve API Gateway endpoints from CloudFormation stack."
    exit 1
fi

echo "Retrieved API Gateway endpoints:"
echo "Dev: $DEV_API_ENDPOINT"
echo "Prod: $PROD_API_ENDPOINT"

# Update app.js with the actual API Gateway endpoint
echo "Updating app.js with API Gateway endpoint..."
sed -i "s|https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/dev/upload|$DEV_API_ENDPOINT|g" app.js

# Deploy frontend files to S3 bucket
echo "Deploying frontend files to S3 bucket..."
aws s3 sync . s3://$BUCKET_NAME --exclude "*.sh" --exclude "README.md" --acl public-read

# Output success message
echo "Frontend deployment completed successfully!"
echo "Website URL: http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
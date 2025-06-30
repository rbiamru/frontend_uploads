# Gateway DataSecure Inc. Document Upload System - Frontend Deployment Script (PowerShell)

# Check if AWS CLI is installed
try {
    $awsVersion = aws --version
    Write-Host "AWS CLI is installed: $awsVersion"
}
catch {
    Write-Host "AWS CLI is not installed. Please install it first."
    exit 1
}

# Get stack name from user
$STACK_NAME = Read-Host -Prompt "Enter CloudFormation stack name"

# Get AWS region from user
$AWS_REGION = Read-Host -Prompt "Enter AWS region (e.g., us-east-1)"

# Get frontend bucket name from CloudFormation outputs
Write-Host "Retrieving S3 bucket name from CloudFormation stack..."
$BUCKET_NAME = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='FrontendWebsiteURL'].OutputValue" --output text

if (-not $BUCKET_NAME) {
    Write-Host "Failed to retrieve S3 bucket name from CloudFormation stack."
    exit 1
}

# Extract bucket name from URL
$BUCKET_NAME = $BUCKET_NAME -replace "http://", "" -replace "\.s3-website.*", ""
Write-Host "Retrieved S3 bucket name: $BUCKET_NAME"

# Get API Gateway endpoints from CloudFormation outputs
Write-Host "Retrieving API Gateway endpoints from CloudFormation stack..."
$DEV_API_ENDPOINT = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='DevApiEndpoint'].OutputValue" --output text
$PROD_API_ENDPOINT = aws cloudformation describe-stacks --stack-name $STACK_NAME --region $AWS_REGION --query "Stacks[0].Outputs[?OutputKey=='ProdApiEndpoint'].OutputValue" --output text

if (-not $DEV_API_ENDPOINT -or -not $PROD_API_ENDPOINT) {
    Write-Host "Failed to retrieve API Gateway endpoints from CloudFormation stack."
    exit 1
}

Write-Host "Retrieved API Gateway endpoints:"
Write-Host "Dev: $DEV_API_ENDPOINT"
Write-Host "Prod: $PROD_API_ENDPOINT"

# Update app.js with the actual API Gateway endpoint
Write-Host "Updating app.js with API Gateway endpoint..."
$appJsContent = Get-Content -Path "app.js" -Raw
$appJsContent = $appJsContent -replace "https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/dev/upload", $DEV_API_ENDPOINT
Set-Content -Path "app.js" -Value $appJsContent

# Deploy frontend files to S3 bucket
Write-Host "Deploying frontend files to S3 bucket..."
aws s3 sync . s3://$BUCKET_NAME --exclude "*.sh" --exclude "*.ps1" --exclude "README.md" --acl public-read

# Output success message
Write-Host "Frontend deployment completed successfully!"
Write-Host "Website URL: http://$BUCKET_NAME.s3-website-$AWS_REGION.amazonaws.com"
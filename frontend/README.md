# Gateway DataSecure Inc. Document Upload System - Frontend

This is the frontend application for the Gateway DataSecure Inc. Document Upload System. It provides a user interface for uploading documents to the secure document storage system.

## Features

- Environment-aware UI (automatically detects dev/prod environment)
- Document upload form with client validation
- Support for multiple document types
- File type and size validation
- Responsive design

## Setup Instructions

1. Deploy the CloudFormation template (Module3.yaml) to set up the backend infrastructure
2. After deployment, get the API Gateway endpoint URLs from the CloudFormation outputs
3. Update the `apiEndpoint` in `app.js` with your actual API Gateway endpoint
4. Upload the frontend files to the S3 bucket created by the CloudFormation template

## Deployment

To deploy the frontend to the S3 bucket:

```bash
# Replace YOUR_BUCKET_NAME with the actual bucket name from CloudFormation outputs
aws s3 sync . s3://YOUR_BUCKET_NAME --acl public-read
```

## Configuration

The main configuration is in the `app.js` file:

```javascript
const config = {
    apiEndpoint: 'https://YOUR_API_GATEWAY_ID.execute-api.YOUR_REGION.amazonaws.com/dev/upload',
    maxFileSize: 2 * 1024 * 1024, // 2MB in bytes
    allowedFileTypes: ['.doc', '.txt', '.pdf', '.ppt']
};
```

Replace `YOUR_API_GATEWAY_ID` and `YOUR_REGION` with the actual values from your CloudFormation deployment.

## Testing

You can test the application locally by opening the `index.html` file in a web browser. However, API calls will only work when the backend is properly deployed and the API endpoint is correctly configured.

## Environment Detection

The application automatically detects whether it's running in a development or production environment based on the URL. If the URL contains "prod" or "production", it will switch to production mode and use the production API endpoint.
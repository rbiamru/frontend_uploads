# Gateway DataSecure Inc. Document Upload System

A serverless document upload system built with AWS services and automated CI/CD deployment.

## Architecture

- **Frontend**: Static website hosted on S3 with CloudFront CDN
- **Backend**: Lambda function for file processing
- **Storage**: S3 buckets for documents, DynamoDB for metadata
- **API**: API Gateway for REST endpoints
- **Deployment**: GitHub Actions for automated CI/CD

## Features

- ✅ Secure document upload (PDF, DOC, TXT, PPT)
- ✅ File size validation (2MB limit)
- ✅ Client/Case ID organization
- ✅ Environment-aware (dev/prod)
- ✅ CORS-enabled API
- ✅ Automated deployment pipeline

## Live Demo

- [**Live Website**](https://d29o6u4zvdzafs.cloudfront.net/)
- **API Endpoint**: https://20k4m2p4g4.execute-api.us-east-1.amazonaws.com/dev/upload

## Quick Start

### Prerequisites
- AWS Account
- GitHub repository
- AWS CLI configured

### Deployment

1. **Clone and Setup**
   ```bash
   git clone <your-repo>
   cd frontend-upload
   ```

2. **Configure GitHub Secrets**
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

3. **Deploy**
   ```bash
   git push origin main
   ```
   GitHub Actions automatically deploys the entire stack.

## Project Structure

```
├── frontend/                 # Static website files
│   ├── index.html
│   ├── app.js               # Frontend logic
│   └── styles.css
├── upload_via_gateway/
│   └── backend/
│       └── lambda_function.py # Lambda function code
├── .github/workflows/
│   └── deploy.yml           # CI/CD pipeline
├── Module3.yaml             # CloudFormation template
└── README.md
```

## AWS Resources Created

- S3 Buckets: Frontend hosting + document storage
- CloudFront: CDN distribution
- Lambda: File upload processing
- API Gateway: REST API endpoints
- DynamoDB: Document metadata
- IAM Roles: Service permissions

## Usage

1. Open the website URL
2. Fill in Client ID, Case ID, and Document Type
3. Select a file (PDF, DOC, TXT, PPT)
4. Click "Upload Document"
5. Files are stored in S3 with metadata in DynamoDB

## File Organization

Documents are stored in S3 with the structure:
```
s3://bucket-name/
└── {ClientID}/
    └── {CaseID}/
        └── {DocumentType}/
            └── {filename}
```

## Environment Support

- **Dev**: Default environment for testing
- **Prod**: Production environment (URL-based detection)

## Monitoring

- CloudWatch Logs: Lambda function logs
- S3 Access Logs: File access tracking
- API Gateway Logs: Request/response monitoring

## Security

- CORS-enabled for cross-origin requests
- IAM roles with least privilege access
- S3 bucket policies for secure access
- File type and size validation

## Cost Optimization

- S3 Standard storage class
- Pay-per-request DynamoDB billing
- CloudFront caching for reduced S3 requests
- Lambda with optimized memory allocation

## Support

For issues or questions, check:
- CloudWatch Logs for Lambda errors
- API Gateway logs for request issues
- GitHub Actions logs for deployment problems

# Gateway DataSecure Inc. Document Upload System

## Overview

This document provides comprehensive documentation for the Gateway DataSecure Inc. Document Upload System, an environment-aware solution for secure document submission and storage. The system supports separate development and production environments, with appropriate security measures and logging capabilities.

## Table of Contents

1. [Configuration Steps](#configuration-steps)
2. [Environment Separation (Dev/Prod)](#environment-separation-devprod)
3. [Metadata Schema Description](#metadata-schema-description)
4. [API Sample Request/Response](#api-sample-requestresponse)
5. [Security and Logging Implementation](#security-and-logging-implementation)

## Configuration Steps

### 1. Infrastructure Deployment

The system is deployed using AWS CloudFormation with the following steps:

1. **Deploy CloudFormation Template**:
   ```bash
   aws cloudformation create-stack --stack-name gateway-datasecure-inc --template-body file://Module3.yaml --capabilities CAPABILITY_NAMED_IAM
   ```

2. **Get Deployment Outputs**:
   ```bash
   aws cloudformation describe-stacks --stack-name gateway-datasecure-inc --query "Stacks[0].Outputs"
   ```

3. **Upload Frontend Files**:
   ```bash
   aws s3 cp frontend/ s3://gateway-datasecure-inc-frontend-043088695051/ --recursive
   ```

4. **Update API Endpoint**:
   Edit `script_api_s3.js` to update the API_BASE variable:
   ```javascript
   const API_BASE = "https://rrdb8rze7l.execute-api.us-east-1.amazonaws.com/dev";
   ```

### 2. System Components

- **Frontend**: Static website hosted on S3 (http://gateway-datasecure-inc-frontend-043088695051.s3-website-us-east-1.amazonaws.com)
- **API Gateway**: REST API with dev and prod stages (https://rrdb8rze7l.execute-api.us-east-1.amazonaws.com)
- **Lambda Functions**: Environment-specific functions for processing uploads
- **S3 Buckets**: Separate buckets for dev and prod document storage
- **DynamoDB**: Table for document metadata storage (DocumentMetadata)

## Environment Separation (Dev/Prod)

The system implements environment separation through several mechanisms:

### 1. Separate Infrastructure

- **S3 Buckets**: 
  - Development: `gateway-datasecure-inc-docs-dev-043088695051`
  - Production: `gateway-datasecure-inc-docs-prod-043088695051`

- **Lambda Functions**:
  - Development: `gateway-datasecure-inc-upload-function-dev`
  - Production: `gateway-datasecure-inc-upload-function-prod`

### 2. API Gateway Stages

- **Development Stage**: `/dev`
- **Production Stage**: `/prod`

Each stage is connected to its corresponding Lambda function.

### 3. Environment Variables

Each Lambda function has environment-specific variables:

```
UPLOAD_BUCKET: [environment-specific S3 bucket]
TABLE_NAME: DocumentMetadata
ENVIRONMENT: dev or prod
```

### 4. Metadata Tagging

All resources (S3 objects and DynamoDB records) are tagged with the environment:

- S3 object metadata includes `environment: dev` or `environment: prod`
- DynamoDB records include an `environment` attribute

### 5. Frontend Environment Detection

The frontend JavaScript automatically detects the environment based on the URL:
- If URL contains "prod", it uses the production API endpoint
- Otherwise, it uses the development API endpoint

## Metadata Schema Description

### DynamoDB Table Schema

**Table Name**: `DocumentMetadata`

**Primary Key**:
- Partition Key: `ClientID` (String)
- Sort Key: `CaseID` (String)

**Attributes**:

| Attribute | Type | Description |
|-----------|------|-------------|
| ClientID | String | Client identifier (partition key) |
| CaseID | String | Case identifier (sort key) |
| document_type | String | Type of document (e.g., financial, legal) |
| date_stored | String | Date when document was stored (YYYY-MM-DD) |
| file_location | String | S3 URI to the stored document |
| environment | String | Environment identifier (dev/prod) |
| file_name | String | Original filename |
| file_size | Number | Size of file in bytes |
| file_type | String | File extension without dot |
| upload_timestamp | String | ISO format timestamp of upload |

### S3 Object Metadata

Each document stored in S3 includes the following metadata:

| Metadata Key | Description |
|-------------|-------------|
| client-id | Client identifier |
| case-id | Case identifier |
| document-type | Type of document |
| date-stored | Date when document was stored |
| environment | Environment identifier (dev/prod) |

### File Structure in S3

Files are organized in S3 using the following path structure:
```
{ClientID}/{CaseID}/{DocumentType}/{FileName}
```

Example:
```
ACME/CASE123/legal/contract.pdf
```

## API Sample Request/Response

### Upload Document Request

**Endpoint**: `https://rrdb8rze7l.execute-api.us-east-1.amazonaws.com/dev/upload`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "clientId": "ACME",
  "caseId": "CASE123",
  "documentType": "legal",
  "fileName": "contract.pdf",
  "fileContent": "JVBERi0xLjMKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwgL0xlbmd0aCA1IDAgUiAv..."
}
```

### Successful Response

**Status Code**: 200

**Response Body**:
```json
{
  "message": "File uploaded successfully",
  "location": "ACME/CASE123/legal/contract.pdf",
  "environment": "dev"
}
```

### Error Response

**Status Code**: 400

**Response Body**:
```json
{
  "error": "Invalid file type. Allowed types: .doc, .txt, .pdf, .ppt"
}
```

## Security and Logging Implementation

### Security Measures

1. **File Validation**:
   - File type validation (only .doc, .txt, .pdf, .ppt allowed)
   - File size validation (maximum 2MB)
   - Input validation for all required fields

2. **Access Control**:
   - S3 bucket policies restrict access to authorized users
   - Lambda functions use IAM roles with least privilege
   - API Gateway uses appropriate IAM permissions

3. **CORS Configuration**:
   - Configured on both S3 buckets and API Gateway
   - Prevents unauthorized cross-origin requests

4. **Data Handling**:
   - Base64 encoding for secure file transfer
   - Proper error handling to prevent information leakage

### Logging Implementation

1. **Lambda Logging**:
   - Comprehensive logging using Python's logging module
   - Log level set to INFO for normal operations
   - Exception details logged for troubleshooting
   - Environment-specific logging

2. **Log Events**:
   - Request processing start/end
   - File validation results
   - S3 upload operations
   - DynamoDB operations
   - Error conditions with details

3. **CloudWatch Integration**:
   - All Lambda logs sent to CloudWatch Logs
   - Log groups organized by function name
   - Log retention configured appropriately

4. **Audit Trail**:
   - Upload timestamp stored in DynamoDB
   - Environment information included in logs and metadata
   - File operations tracked with client and case IDs

---

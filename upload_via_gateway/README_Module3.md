# Module 3: Environment-Aware Document Upload System

This module extends Gateway DataSecure Inc.'s secure document submission portal with support for environment-specific API Gateway stages (`dev`, `prod`) and secure file upload processing using S3, Lambda (Python), and DynamoDB.

---

## 📁 Project Structure

```
module3/
│
├── frontend/
│   ├── index.html         # Upload form interface
│   ├── styles.css         # Basic UI styling
│   └── script_api_s3.js   # JavaScript to validate, encode, and call API
│
└── backend/
    └── lambda_function.py # Python Lambda function for upload processing
```

---

## 🌐 System Overview

- **Frontend (S3 Hosted)**  
  Collects metadata and file, validates input, encodes file in Base64, and sends it as a JSON API request.

- **Backend (Python Lambda Function)**  
  Receives JSON payload, decodes the file, uploads it to S3, and stores metadata in DynamoDB with environment tagging.

---

## ✅ Required Environment Variables (Lambda)

Each Lambda function (`dev` and `prod`) must be configured with the following:

| Key              | Description                                      | Example                            |
|------------------|--------------------------------------------------|------------------------------------|
| `UPLOAD_BUCKET`  | S3 bucket name for file storage                  | `gateway-datasecure-inc-docs-dev` |
| `TABLE_NAME`     | DynamoDB table for metadata                      | `DocumentMetadata`                |
| `ENVIRONMENT`    | Used for tagging/logging                         | `dev` or `prod`                    |

Set these in the Lambda console → **Configuration → Environment variables**.

---

## 🚀 Setup Instructions

### 🔹 Frontend (S3 Hosted Static Site)

1. Create a new S3 bucket and enable **Static Website Hosting**
2. Upload all files from the `frontend/` directory:
   - `index.html`
   - `styles.css`
   - `script_api_s3.js`
3. Set **CORS configuration** for the bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": [],
    "MaxAgeSeconds": 3000
  }
]
```

4. In `script_api_s3.js`, update the API endpoint:

```javascript
const API_BASE = "https://<api-id>.execute-api.<region>.amazonaws.com/dev";
```

---

### 🔹 Backend (Python Lambda Function)

1. Open AWS Lambda → Create a function
2. Use:
   - Runtime: **Python 3.9**
   - Handler: `lambda_function.lambda_handler`
3. Copy the code from `backend/lambda_function.py`
4. Set the environment variables (`UPLOAD_BUCKET`, `TABLE_NAME`, `ENVIRONMENT`)
5. Use the **provided LabRole** (no need to assign additional IAM permissions)
6. Connect this Lambda to your API Gateway

---

### 🔹 API Gateway (REST API)

1. Create a **REST API**
2. Add `/upload` resource with `POST` method
3. Use **Lambda Proxy Integration**
4. Enable binary media types:
   ```
   multipart/form-data
   application/octet-stream
   ```
5. Enable **CORS** for POST and OPTIONS methods
6. Deploy stages: `dev` and `prod`
7. Copy the stage URL and update it in the frontend JS file

---

### 🔹 DynamoDB Table

- **Name**: `DocumentMetadata`
- **Partition Key**: `ClientID` (String)
- **Sort Key**: `CaseID` (String)

The table stores:
- File name
- File size
- Upload timestamp
- Document type
- Upload location
- Environment

---

## 🧪 Testing Instructions

### ✅ Through the Web Interface

1. Open the static website (S3 bucket URL)
2. Enter:
   - `Client ID`, `Case ID`, `Document Type`
   - Choose a file (`.doc`, `.txt`, `.pdf`, `.ppt`) under 2MB
3. Click **Upload Document**
4. Check:
   - ✅ File appears in S3 under `uploads/{ClientID}/{CaseID}/{DocumentType}/filename`
   - ✅ DynamoDB contains the corresponding metadata

### ✅ Using Curl

If you want to simulate the API directly:

#### Example `upload.json`

```json
{
  "clientId": "ACME",
  "caseId": "CASE123",
  "documentType": "legal",
  "fileName": "hello.txt",
  "fileContent": "SGVsbG8gd29ybGQh"
}
```

#### Curl Command

```bash
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/dev/upload \
  -H "Content-Type: application/json" \
  -d @upload.json
```

> You can use `base64 hello.txt` to generate the encoded file content.

---

## 💡 Tips for Students

| Area             | Tip                                                                 |
|------------------|----------------------------------------------------------------------|
| Lambda Logs      | Check CloudWatch logs for debugging (`print()` or `logger.info()`)   |
| File Validation  | Use both frontend and backend checks for size/type                   |
| API Errors       | Inspect `400` or `500` responses for missing fields or decoding issues |
| Base64 Handling  | Ensure only the encoded string is sent (strip `data:*/*;base64,`)     |
| Lab Role         | You do **not** need to modify IAM permissions — use the provided LabRole |
| Environment Tags | Use `ENVIRONMENT` to separate dev and prod uploads                   |

---

## ✅ S3 Structure Example

```
uploads/
└── ACME/
    └── CASE123/
        └── legal/
            └── hello.txt

```

---
# Writing YAML in cloudformation

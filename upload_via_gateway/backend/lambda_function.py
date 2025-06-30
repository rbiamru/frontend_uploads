import json
import boto3
import base64
import logging
import os
from datetime import datetime
from urllib.parse import parse_qs
import io

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

BUCKET_NAME = os.environ.get('UPLOAD_BUCKET')
TABLE_NAME = os.environ.get('TABLE_NAME')  # Now optional
ALLOWED_FILE_TYPES = ['.doc', '.txt', '.pdf', '.ppt']
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB in bytes

def lambda_handler(event, context):
    # Handle CORS preflight request
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 204,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            }
        }
    
    environment = os.environ.get('ENVIRONMENT', 'dev')
    logger.info(f"Processing upload request in {environment} environment")

    try:
        if 'body' not in event:
            return error_response("Invalid request: Missing body")

        body = event['body']
        if event.get('isBase64Encoded', False):
            body = base64.b64decode(body).decode('utf-8')

        content_type = event.get('headers', {}).get('Content-Type', '')
        form_data = parse_multipart_form(body, content_type)

        client_id = form_data.get('clientId')
        case_id = form_data.get('caseId')
        document_type = form_data.get('documentType')
        file_content = form_data.get('file', {}).get('content')
        file_name = form_data.get('file', {}).get('filename')

        if not all([client_id, case_id, document_type, file_content, file_name]):
            return error_response("Missing required fields")

        file_extension = os.path.splitext(file_name)[1].lower()
        if file_extension not in ALLOWED_FILE_TYPES:
            return error_response(f"Invalid file type. Allowed types: {', '.join(ALLOWED_FILE_TYPES)}")

        if len(file_content) > MAX_FILE_SIZE:
            return error_response("File size exceeds the maximum limit of 2MB")

        s3_key = f"{client_id}/{case_id}/{document_type}/{file_name}"
        current_date = datetime.now().strftime("%Y-%m-%d")

        logger.info(f"Uploading file to S3: {s3_key}")
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=get_content_type(file_extension),
            Metadata={
                'client-id': client_id,
                'case-id': case_id,
                'document-type': document_type,
                'date-stored': current_date,
                'environment': environment
            }
        )

        if TABLE_NAME:
            try:
                logger.info(f"Storing metadata in DynamoDB: {TABLE_NAME}")
                table = dynamodb.Table(TABLE_NAME)
                table.put_item(
                    Item={
                        'ClientID': client_id,
                        'CaseID': case_id,
                        'document_type': document_type,
                        'date_stored': current_date,
                        'file_location': f"s3://{BUCKET_NAME}/{s3_key}",
                        'environment': environment,
                        'file_name': file_name,
                        'file_size': len(file_content),
                        'file_type': file_extension[1:] if file_extension.startswith('.') else file_extension,
                        'upload_timestamp': datetime.now().isoformat()
                    }
                )
            except Exception as e:
                logger.warning(f"DynamoDB write failed, skipping metadata storage: {str(e)}")
        else:
            logger.info("No TABLE_NAME provided. Skipping DynamoDB metadata write.")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'location': s3_key,
                'environment': environment
            })
        }

    except Exception:
        logger.exception("Error processing upload")
        return error_response("Error processing upload")

def parse_multipart_form(body, content_type):
    form_data = {}

    try:
        json_data = json.loads(body)
        form_data['clientId'] = json_data.get('clientId')
        form_data['caseId'] = json_data.get('caseId')
        form_data['documentType'] = json_data.get('documentType')

        if 'fileContent' in json_data and 'fileName' in json_data:
            file_content = base64.b64decode(json_data['fileContent'])
            form_data['file'] = {
                'content': file_content,
                'filename': json_data['fileName']
            }
    except Exception:
        logger.info("JSON parsing failed, trying query string fallback")
        parsed_qs = parse_qs(body)
        form_data['clientId'] = parsed_qs.get('clientId', [''])[0]
        form_data['caseId'] = parsed_qs.get('caseId', [''])[0]
        form_data['documentType'] = parsed_qs.get('documentType', [''])[0]

        if 'file' in parsed_qs:
            form_data['file'] = {
                'content': parsed_qs['file'][0],
                'filename': 'document.txt'
            }

    return form_data

def get_content_type(file_extension):
    content_types = {
        '.txt': 'text/plain',
        '.doc': 'application/msword',
        '.pdf': 'application/pdf',
        '.ppt': 'application/vnd.ms-powerpoint'
    }
    return content_types.get(file_extension, 'application/octet-stream')

def error_response(message):
    logger.exception("Error processing request")
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'error': message
        })
    }

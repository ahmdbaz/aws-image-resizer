import json
import boto3
import base64
from urllib.parse import unquote

s3 = boto3.client('s3', region_name='eu-central-1')
BUCKET = 'image-input-025557560412-eu-central-1-an'

def lambda_handler(event, context):
    filename = unquote(event['queryStringParameters']['filename']).replace(' ', '_')
    
    image_data = base64.b64decode(event['body'])
    
    s3.put_object(
        Bucket=BUCKET,
        Key=filename,
        Body=image_data
    )
    
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
        },
        'body': json.dumps({'message': 'Image uploaded successfully'})
    }
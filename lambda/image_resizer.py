import json
import boto3
import os
from PIL import Image
import io

s3 = boto3.client('s3')
sns = boto3.client('sns')

OUTPUT_BUCKET = 'image-output-025557560412-eu-central-1-an'
SNS_TOPIC_ARN = 'arn:aws:sns:eu-central-1:025557560412:image-processed'

def lambda_handler(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    response = s3.get_object(Bucket=bucket, Key=key)
    image_data = response['Body'].read()
    
    image = Image.open(io.BytesIO(image_data))
    
    ext = key.lower().split('.')[-1]
    format_map = {
        'jpg': 'JPEG',
        'jpeg': 'JPEG',
        'png': 'PNG',
        'gif': 'GIF',
        'webp': 'WEBP',
        'bmp': 'BMP'
    }
    fmt = format_map.get(ext, image.format or 'JPEG')
    
    if fmt == 'JPEG' and image.mode in ('RGBA', 'LA', 'P'):
        image = image.convert('RGB')
    
    image = image.resize((300, 300))
    
    buffer = io.BytesIO()
    image.save(buffer, format=fmt)
    buffer.seek(0)
    
    output_key = f'resized-{key}'
    s3.put_object(
        Bucket=OUTPUT_BUCKET,
        Key=output_key,
        Body=buffer
    )
    
    sns.publish(
        TopicArn=SNS_TOPIC_ARN,
        Subject='Image Processed',
        Message=f'Image {key} has been resized and saved to {OUTPUT_BUCKET} as {output_key}'
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps('Image processed successfully')
    }
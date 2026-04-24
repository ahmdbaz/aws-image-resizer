# Serverless Image Resizer

A fully serverless image processing pipeline built on AWS. Upload any image through 
the frontend and it gets automatically resized to 300x300 and saved to cloud storage, 
with an email notification sent on completion.

Built as part of my AWS cloud portfolio while preparing for the SAA-C03 exam.

## Architecture
<img width="1832" height="859" alt="image-resizer-aws drawio" src="https://github.com/user-attachments/assets/a2a8b287-ddea-44d2-ac8f-97a1ed7b1c66" />

## Services Used
- S3 (x3) — frontend hosting, image input bucket, image output bucket
- CloudFront — CDN and HTTPS for the frontend
- API Gateway — public HTTP endpoint for image uploads
- Lambda (x2) — imageUploader and imageResizer functions
- Lambda Layers — custom Pillow layer for image processing
- SNS — email notifications on successful processing
- CloudWatch — Lambda logging and monitoring
- IAM — permissions between all services

## Live Demo
https://d3n4907fc1mp50.cloudfront.net

## How It Works
1. User uploads an image on the frontend
2. Frontend converts the image to base64 and sends it to API Gateway
3. `imageUploader` Lambda decodes it and saves it to the input S3 bucket
4. S3 automatically triggers `imageResizer` Lambda via an event notification
5. `imageResizer` uses Pillow to resize the image to 300x300
6. Resized image is saved to the output S3 bucket
7. SNS sends an email notification confirming the image was processed

## What I Learned
- How S3 event notifications trigger Lambda automatically (event-driven architecture)
- How Lambda Layers work and how to build one for Linux from scratch
- How to handle CORS on both API Gateway and S3
- How to encode and decode images as base64 between frontend and Lambda
- How SNS subscriptions and email notifications work
- How to sanitize filenames and handle different image formats (JPG, PNG, WEBP, GIF, BMP)
- How CloudShell can be used to build and deploy Lambda layers directly in AWS

## Challenges & How I Fixed Them

### 1. Pillow Layer — Windows vs Linux incompatibility
The first Pillow layer was built on Windows and failed with `cannot import name '_imaging'` 
because Lambda runs on Linux. Fixed by rebuilding the layer inside AWS CloudShell using 
the `--platform manylinux2014_x86_64` flag to get the correct Linux binaries.

### 2. Public Lambda Layers blocked
Tried using public Klayers ARNs for Pillow but got `Access denied to lambda:GetLayerVersion`. 
Had to build and publish a custom layer manually via CloudShell.

### 3. CORS on S3 presigned URLs
Initially tried direct browser uploads to S3 using presigned URLs. The browser preflight 
OPTIONS request kept failing because S3 doesn't return CORS headers for presigned URLs 
with temporary security tokens. Switched to routing uploads through API Gateway → Lambda 
instead, which solved the issue completely.

### 4. Spaces in filenames
Filenames with spaces caused `NoSuchKey` errors because the URL-encoded spaces (`%20`) 
didn't match the actual S3 key. Fixed by URL-decoding the filename in Lambda using 
`urllib.parse.unquote` then replacing spaces with underscores.

### 5. PNG files not processing
PNG files failed silently because `image.format` returned `None` in some cases, 
causing Lambda to fall back to JPEG which broke PNG files. Fixed by detecting the 
format from the file extension and handling RGBA/transparency conversion for formats 
that don't support it.

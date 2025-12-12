import boto3
from fastapi import HTTPException
from starlette import status
from stream_chat import StreamChat

from app.core.settings import settings

s3_client = boto3.client(
    "s3",
    region_name=settings.S3_BUCKET_REGION,
    # These settings are only necessary when using LocalStack for local development and testing
    # Will be ignored when using real AWS S3 in production
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    endpoint_url=settings.LOCALSTACK_ENDPOINT_URL,
)


def get_stream_client() -> StreamChat:
    if not settings.STREAM_API_KEY or not settings.STREAM_API_SECRET:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE)
    return StreamChat(api_key=settings.STREAM_API_KEY, api_secret=settings.STREAM_API_SECRET)

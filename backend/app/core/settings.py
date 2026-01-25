from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    APP_ENV: str
    SECRET_KEY: str

    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    SYNC_DATABASE_URL: str
    ASYNC_DATABASE_URL: str

    # These are "nullable" because they are required by LocalStack for local development
    # but not needed for production with AWS (S3 access is via IAM roles, NOT access keys)
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    AWS_ENDPOINT_URL: str | None = None
    LOCALSTACK_ENDPOINT_URL: str | None = None

    S3_BUCKET_NAME: str
    S3_BUCKET_REGION: str

    JWT_EXP_SECONDS: int

    STREAM_API_KEY: str | None = None
    STREAM_API_SECRET: str | None = None

    # Google Cloud Vision (optional)
    VISION_ENABLED: bool = False
    GOOGLE_APPLICATION_CREDENTIALS: str | None = None

    DOCTOR_CARD_PRESIGNED_URL_EXP_SECONDS: int

    DOCS_USERNAME: str | None = None
    DOCS_PASSWORD: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

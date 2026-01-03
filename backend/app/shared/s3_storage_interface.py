import mimetypes
import uuid
from typing import BinaryIO
from uuid import UUID

from botocore.exceptions import BotoCoreError, ClientError
from fastapi import UploadFile

from app.core.clients import s3_client
from app.core.settings import settings


class S3StorageInterface:
    # =================================================================
    # =========================== PRODUCT =============================
    # =================================================================
    PRODUCT_PREFIX = "products"

    @staticmethod
    def put_product_img(product_id: int, product_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.PRODUCT_PREFIX,
            file_name=str(product_id),
            file_obj=product_img.file,
            content_type=str(product_img.content_type),
        )

    @staticmethod
    def put_product_img_from_filepath(product_id: int, product_img_filepath: str) -> str | None:
        return S3StorageInterface._put_img_from_filepath(
            prefix=S3StorageInterface.PRODUCT_PREFIX,
            file_name=str(product_id),
            img_filepath=product_img_filepath,
        )

    # =================================================================
    # ===================== PRODUCT DRAFTS ============================
    # =================================================================
    PRODUCT_DRAFT_PREFIX = "product-drafts"

    @staticmethod
    def put_product_draft_img(draft_id: int, draft_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.PRODUCT_DRAFT_PREFIX,
            file_name=str(draft_id),
            file_obj=draft_img.file,
            content_type=str(draft_img.content_type),
        )

    @staticmethod
    def promote_product_draft_img(product_id: int, draft_img_key: str) -> str | None:
        """
        Copies a product draft image to the published product storage.
        Returns the new image key for the published product, or None on failure.
        """
        try:
            # Parse the extension from the draft key
            extension = draft_img_key.split(".")[-1] if "." in draft_img_key else "jpg"
            new_key = f"{S3StorageInterface.PRODUCT_PREFIX}/{product_id}.{extension}"

            # Copy the object from draft to product location
            s3_client.copy_object(
                Bucket=settings.S3_BUCKET_NAME,
                CopySource={"Bucket": settings.S3_BUCKET_NAME, "Key": draft_img_key},
                Key=new_key,
            )

            # Optionally delete the draft image after successful copy
            s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=draft_img_key)

            return new_key
        except (BotoCoreError, ClientError) as e:
            print(f"Error promoting product draft image: {e}")
            return None

    # =================================================================
    # =========================== RECIPES =============================
    # =================================================================
    RECIPE_PREFIX = "recipes"

    @staticmethod
    def put_recipe_img(recipe_id: int, recipe_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.RECIPE_PREFIX,
            file_name=str(recipe_id),
            file_obj=recipe_img.file,
            content_type=str(recipe_img.content_type),
        )

    @staticmethod
    def put_recipe_img_from_filepath(recipe_id: int, recipe_img_filepath: str) -> str | None:
        return S3StorageInterface._put_img_from_filepath(
            prefix=S3StorageInterface.RECIPE_PREFIX,
            file_name=str(recipe_id),
            img_filepath=recipe_img_filepath,
        )

    # =================================================================
    # ===================== RECIPE DRAFTS =============================
    # =================================================================
    RECIPE_DRAFT_PREFIX = "recipe-drafts"

    @staticmethod
    def put_recipe_draft_img(draft_id: int, draft_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.RECIPE_DRAFT_PREFIX,
            file_name=str(draft_id),
            file_obj=draft_img.file,
            content_type=str(draft_img.content_type),
        )

    @staticmethod
    def promote_recipe_draft_img(recipe_id: int, draft_img_key: str) -> str | None:
        """
        Copies a recipe draft image to the published recipe storage.
        Returns the new image key for the published recipe, or None on failure.
        """
        try:
            # Parse the extension from the draft key
            extension = draft_img_key.split(".")[-1] if "." in draft_img_key else "jpg"
            new_key = f"{S3StorageInterface.RECIPE_PREFIX}/{recipe_id}.{extension}"

            # Copy the object from draft to recipe location
            s3_client.copy_object(
                Bucket=settings.S3_BUCKET_NAME,
                CopySource={"Bucket": settings.S3_BUCKET_NAME, "Key": draft_img_key},
                Key=new_key,
            )

            # Optionally delete the draft image after successful copy
            s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=draft_img_key)

            return new_key
        except (BotoCoreError, ClientError) as e:
            print(f"Error promoting recipe draft image: {e}")
            return None

    # =======================================================================================
    # ============== STAGING AREA FOR QUALIFICATIONS (DOCTOR + NUTRITIONIST) ================
    # =======================================================================================
    """
    When uploading a qualification image for an account creation request, it is first stored in a staging area.
    Once the request is approved, the image is moved to the permanent qualifications storage.

    We use the prefix to differentiate between the "staging qualifications" for the Doctors & Nutritionists.
    """

    STAGING_QUALIFICATION_PREFIX = "staging-qualifications"

    @staticmethod
    def put_staging_qualification_img(staging_qualification_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.STAGING_QUALIFICATION_PREFIX,
            file_name=str(uuid.uuid4()),
            file_obj=staging_qualification_img.file,
            content_type=str(staging_qualification_img.content_type),
        )

    @staticmethod
    def promote_staging_qualification_img(user_id: UUID, staging_img_key: str) -> str | None:
        """
        Moves a qualification image from the staging area to the permanent qualifications storage.

        Args:
            staging_obj_key: The S3 object key of the staging qualification image.
            user_id: The user ID to associate with the permanent qualification image.
        """
        try:
            permanent_obj_key: str = f"{S3StorageInterface.QUALIFICATION_PREFIX}/{user_id}"
            s3_client.copy_object(
                CopySource={
                    "Bucket": settings.S3_BUCKET_NAME,
                    "Key": staging_img_key,
                },
                Bucket=settings.S3_BUCKET_NAME,
                Key=permanent_obj_key,
            )

            s3_client.delete_object(
                Bucket=settings.S3_BUCKET_NAME,
                Key=staging_img_key,
            )
            return permanent_obj_key
        except (BotoCoreError, ClientError) as e:
            print(f"Error promoting staging qualification image {staging_img_key}: {e}")
            return None

    # =======================================================
    # ================= EDU ARTICLE IMAGES ==================
    # =======================================================
    ARTICLE_PREFIX = "edu-articles"

    @staticmethod
    def put_article_img(article_id: int, article_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.ARTICLE_PREFIX,
            file_name=str(article_id),
            file_obj=article_img.file,
            content_type=str(article_img.content_type),
        )

    # =====================================================
    # ================ QUALIFICATIONS =====================
    # =====================================================
    QUALIFICATION_PREFIX = "qualifications"

    @staticmethod
    def put_qualification_img(user_id: UUID, qualification_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.QUALIFICATION_PREFIX,
            file_name=str(user_id),
            file_obj=qualification_img.file,
            content_type=str(qualification_img.content_type),
        )

    @staticmethod
    def put_qualification_img_from_filepath(user_id: UUID, qualification_img_filepath: str) -> str | None:
        return S3StorageInterface._put_img_from_filepath(
            file_name=str(user_id),
            img_filepath=qualification_img_filepath,
            prefix=S3StorageInterface.QUALIFICATION_PREFIX,
        )

    # =====================================================
    # =================== PROFILES ========================
    # =====================================================
    PROFILE_PREFIX = "profile-images"

    @staticmethod
    def put_profile_img(user_id: UUID, profile_img: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=S3StorageInterface.PROFILE_PREFIX,
            file_name=str(user_id),
            file_obj=profile_img.file,
            content_type=str(profile_img.content_type),
        )

    @staticmethod
    def put_profile_img_from_filepath(user_id: UUID, profile_img_filepath: str) -> str | None:
        return S3StorageInterface._put_img_from_filepath(
            file_name=str(user_id),
            img_filepath=profile_img_filepath,
            prefix=S3StorageInterface.PROFILE_PREFIX,
        )

    # =====================================================
    # ==================== COMMON ========================
    # ====================================================
    @staticmethod
    def put_uploadfile(prefix: str, file_name: str, uploadfile: UploadFile) -> str | None:
        return S3StorageInterface._upload_file_stream(
            prefix=prefix,
            file_name=file_name,
            file_obj=uploadfile.file,
            content_type=str(uploadfile.content_type),
        )

    @staticmethod
    def get_presigned_url(obj_key: str, expires_in_seconds: int) -> str | None:
        """
        Generates a temporary, presigned URL for a private S3 object.

        Args:
            obj_key: The full object key (e.g., "profile-images/user-id.jpg").

        Returns:
            A string containing the presigned URL, or None if the
            obj_key was empty or an error occurred.
        """
        try:
            url: str = s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": settings.S3_BUCKET_NAME, "Key": obj_key},
                ExpiresIn=expires_in_seconds,
            )
            return url
        except (BotoCoreError, ClientError) as e:
            print(f"Error generating presigned URL for {obj_key}: {e}")
            return None

    @staticmethod
    def _put_img_from_filepath(file_name: str, img_filepath: str, prefix: str) -> str | None:
        content_type, _ = mimetypes.guess_type(img_filepath)  # Guess the type from file path
        if not content_type:
            content_type = "application/octet-stream"  # Default generic type

        try:
            with open(img_filepath, "rb") as f:
                return S3StorageInterface._upload_file_stream(
                    prefix=prefix,
                    file_name=file_name,
                    file_obj=f,
                    content_type=content_type,
                )
        except FileNotFoundError:
            print(f"Error: File not found at path: {img_filepath}")
            return None
        except IOError as e:
            print(f"Error opening or reading file: {e}")
            return None

    @staticmethod
    def _upload_file_stream(prefix: str, file_name: str, file_obj: BinaryIO, content_type: str) -> str | None:
        try:
            extension = mimetypes.guess_extension(content_type)
            if not extension:
                if "jpeg" in content_type:
                    extension = ".jpg"
                elif "png" in content_type:
                    extension = ".png"
                else:
                    extension = ".jpg"

            obj_key = f"{prefix}/{file_name}{extension}"

            s3_client.upload_fileobj(
                Fileobj=file_obj,
                Bucket=settings.S3_BUCKET_NAME,
                Key=obj_key,
                ExtraArgs={"ContentType": content_type},
            )

            return obj_key
        except (BotoCoreError, ClientError) as e:
            print(f"Error uploading file stream: {e}")
            return None

    # @staticmethod
    # def clear_bucket() -> None:
    #     response = s3_client.list_objects_v2(Bucket=bucket_name)

    #     if "Contents" in response:
    #         # Loop through each object and delete it
    #         for obj in response["Contents"]:
    #             print(f"Deleting {obj['Key']}...")
    #             s3.delete_object(Bucket=bucket_name, Key=obj["Key"])

    #         # Check for pagination
    #         while response.get("IsTruncated"):  # If there are more objects to be listed
    #             response = s3.list_objects_v2(Bucket=bucket_name, ContinuationToken=response["NextContinuationToken"])
    #             for obj in response["Contents"]:
    #                 print(f"Deleting {obj['Key']}...")
    #                 s3.delete_object(Bucket=bucket_name, Key=obj["Key"])

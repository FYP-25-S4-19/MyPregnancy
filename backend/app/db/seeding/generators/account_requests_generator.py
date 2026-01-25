import os
import pathlib
import random
import uuid

from argon2 import PasswordHasher
from faker import Faker
from sqlalchemy.orm import Session

from app.db.db_schema import (
    AccountCreationRequestStatus,
    DoctorAccountCreationRequest,
    DoctorSpecialisation,
    MCRNumber,
    NutritionistAccountCreationRequest,
)
from app.shared.s3_storage_interface import S3StorageInterface


class AccountRequestsGenerator:
    @staticmethod
    def generate_doctor_account_requests(
        db: Session,
        faker: Faker,
        password_hasher: PasswordHasher,
        qualifications_img_folder: str,
        mcr_pool: list[MCRNumber],
        specialisations: list[DoctorSpecialisation],
        count: int = 5,
    ) -> list[DoctorAccountCreationRequest]:
        """Generate pending doctor account creation requests"""
        if not os.path.exists(qualifications_img_folder):
            raise ValueError(f"Qualifications image folder does not exist: {qualifications_img_folder}")

        print(f"Generating {count} Doctor Account Creation Requests....")
        
        # Get all qualification images
        qualification_images = [
            f for f in pathlib.Path(qualifications_img_folder).iterdir()
            if f.is_file() and f.name.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
        
        if not qualification_images:
            raise ValueError(f"No qualification images found in {qualifications_img_folder}")

        all_requests: list[DoctorAccountCreationRequest] = []
        used_emails = set()
        
        for i in range(count):
            # Generate unique fake names and emails
            first_name = faker.first_name()
            last_name = faker.last_name()
            middle_name = faker.first_name() if random.random() > 0.5 else None
            
            # Create unique email from name + counter to avoid duplicates
            email_name = f"{first_name.lower()}.{last_name.lower()}"
            if middle_name:
                email_name = f"{first_name.lower()}.{middle_name[0].lower()}.{last_name.lower()}"
            
            # Ensure email is unique by adding counter if needed
            base_email = f"{email_name}@doctor.com"
            email = base_email
            counter = 1
            while email in used_emails:
                email = f"{email_name}.{counter}@doctor.com"
                counter += 1
            used_emails.add(email)
            
            # Get random MCR number
            mcr_number = random.choice(mcr_pool)
            mcr_pool.remove(mcr_number)
            
            # Get random specialization
            specialisation = random.choice(specialisations)
            
            # Upload a random qualification image using a temporary UUID
            qual_img_file = random.choice(qualification_images)
            temp_uuid = uuid.uuid4()
            qualification_img_key = S3StorageInterface.put_qualification_img_from_filepath(
                temp_uuid,
                str(qual_img_file)
            )
            
            # Determine status - most pending, some rejected
            status = AccountCreationRequestStatus.PENDING
            reject_reason = None
            if random.random() < 0.2:  # 20% chance of rejected
                status = AccountCreationRequestStatus.REJECTED
                reject_reason = random.choice([
                    "Invalid credentials provided",
                    "Qualification document is not clear",
                    "MCR number does not match records",
                    "Incomplete information"
                ])
            
            request = DoctorAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                password=password_hasher.hash("password123"),
                qualification_img_key=qualification_img_key,
                account_status=status,
                mcr_no=mcr_number.value,
                specialisation=specialisation.specialisation,
                reject_reason=reject_reason,
                submitted_at=faker.date_time_between(start_date="-30d", end_date="now"),
            )
            
            db.add(request)
            all_requests.append(request)
        
        db.flush()
        return all_requests

    @staticmethod
    def generate_nutritionist_account_requests(
        db: Session,
        faker: Faker,
        password_hasher: PasswordHasher,
        qualifications_img_folder: str,
        count: int = 5,
    ) -> list[NutritionistAccountCreationRequest]:
        """Generate pending nutritionist account creation requests"""
        if not os.path.exists(qualifications_img_folder):
            raise ValueError(f"Qualifications image folder does not exist: {qualifications_img_folder}")

        print(f"Generating {count} Nutritionist Account Creation Requests....")
        
        # Get all qualification images
        qualification_images = [
            f for f in pathlib.Path(qualifications_img_folder).iterdir()
            if f.is_file() and f.name.lower().endswith((".png", ".jpg", ".jpeg"))
        ]
        
        if not qualification_images:
            raise ValueError(f"No qualification images found in {qualifications_img_folder}")

        all_requests: list[NutritionistAccountCreationRequest] = []
        used_emails = set()
        
        for i in range(count):
            # Generate unique fake names and emails
            first_name = faker.first_name()
            last_name = faker.last_name()
            middle_name = faker.first_name() if random.random() > 0.5 else None
            
            # Create unique email from name + counter to avoid duplicates
            email_name = f"{first_name.lower()}.{last_name.lower()}"
            if middle_name:
                email_name = f"{first_name.lower()}.{middle_name[0].lower()}.{last_name.lower()}"
            
            # Ensure email is unique by adding counter if needed
            base_email = f"{email_name}@nutritionist.com"
            email = base_email
            counter = 1
            while email in used_emails:
                email = f"{email_name}.{counter}@nutritionist.com"
                counter += 1
            used_emails.add(email)
            
            # Upload a random qualification image using a temporary UUID
            qual_img_file = random.choice(qualification_images)
            temp_uuid = uuid.uuid4()
            qualification_img_key = S3StorageInterface.put_qualification_img_from_filepath(
                temp_uuid,
                str(qual_img_file)
            )
            
            # Determine status - most pending, some rejected
            status = AccountCreationRequestStatus.PENDING
            reject_reason = None
            if random.random() < 0.2:  # 20% chance of rejected
                status = AccountCreationRequestStatus.REJECTED
                reject_reason = random.choice([
                    "Invalid credentials provided",
                    "Qualification document is not clear",
                    "Unable to verify credentials",
                    "Incomplete information"
                ])
            
            request = NutritionistAccountCreationRequest(
                first_name=first_name,
                middle_name=middle_name,
                last_name=last_name,
                email=email,
                password=password_hasher.hash("password123"),
                qualification_img_key=qualification_img_key,
                account_status=status,
                reject_reason=reject_reason,
                submitted_at=faker.date_time_between(start_date="-30d", end_date="now"),
            )
            
            db.add(request)
            all_requests.append(request)
        
        db.flush()
        return all_requests

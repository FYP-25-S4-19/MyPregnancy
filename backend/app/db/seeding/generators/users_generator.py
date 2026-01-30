import json
import os
import pathlib
import random
from datetime import datetime, timedelta

from argon2 import PasswordHasher
from faker import Faker
from sqlalchemy.orm import Session

from app.db.db_schema import (
    Admin,
    DoctorSpecialisation,
    MCRNumber,
    Merchant,
    Nutritionist,
    PregnantWoman,
    UserRole,
    VolunteerDoctor,
)
from app.shared.s3_storage_interface import S3StorageInterface


class UsersGenerator:
    @staticmethod
    def generate_pregnant_women(
        db: Session,
        faker: Faker,
        password_hasher: PasswordHasher,
        profile_img_folder: str,
    ) -> list[PregnantWoman]:
        if not os.path.exists(profile_img_folder):
            raise ValueError(f"Profile image folder does not exist: {profile_img_folder}")

        print("Generating users (Pregnant Women)....")
        all_preg_women: list[PregnantWoman] = []
        for folder_item in pathlib.Path(profile_img_folder).iterdir():
            if not folder_item.is_file():
                continue
            if not folder_item.name.lower().endswith((".png", ".jpg", ".jpeg")):
                continue

            fake_created_at: datetime = faker.date_time_between(start_date="-3y", end_date="now")
            full_name: str = folder_item.stem  # Exclude the extension
            fullname_parts: list[str] = full_name.split("_")

            preg_woman = PregnantWoman(
                role=UserRole.PREGNANT_WOMAN,
                first_name=fullname_parts[0],
                middle_name=fullname_parts[1] if len(fullname_parts) >= 3 else "",
                last_name=fullname_parts[2] if len(fullname_parts) >= 3 else fullname_parts[1],
                email=f"{full_name.lower()}@gmail.com",
                hashed_password=password_hasher.hash(full_name),
                created_at=fake_created_at,
                due_date=(  # 30% chance of the "due date" being null
                    fake_created_at + timedelta(days=random.randint(20, 260)) if random.random() > 0.3 else None
                ),
                date_of_birth=faker.date_of_birth(minimum_age=18, maximum_age=50),
            )
            db.add(preg_woman)
            db.flush()

            obj_key = S3StorageInterface.put_profile_img_from_filepath(preg_woman.id, str(folder_item))
            preg_woman.profile_img_key = obj_key
            all_preg_women.append(preg_woman)
        return all_preg_women

    @staticmethod
    def generate_volunteer_doctors(
        db: Session,
        faker: Faker,
        password_hasher: PasswordHasher,
        profile_img_folder: str,
        qualifications_img_folder: str,
        mcr_pool: list[MCRNumber],
        specialisations: list[DoctorSpecialisation],
    ) -> list[VolunteerDoctor]:
        if not os.path.exists(profile_img_folder):
            raise ValueError(f"Profile image folder does not exist: {profile_img_folder}")
        if not os.path.exists(qualifications_img_folder):
            raise ValueError(f"Profile image folder does not exist: {qualifications_img_folder}")

        print("Generating Users (Volunteer Doctors)....")
        # Randomly initialize a medical credential for this user (can be of any random type - doctor, nurse, etc....)
        # Don't initialize the 'credential_owner' yet, until specialist is created later....
        all_doctors: list[VolunteerDoctor] = []
        for folder_item in pathlib.Path(profile_img_folder).iterdir():
            if not folder_item.is_file():
                continue
            if not folder_item.name.lower().endswith((".png", ".jpg", ".jpeg")):
                continue

            fullname = folder_item.stem
            fullname_parts = fullname.split("_")

            # doc_qualification = DoctorQualification(
            #     qualification_img_key="",  # Empty, for now.....
            #     # qualification_option=random.choice(list(DoctorQualificationOption)),
            # )
            doctor = VolunteerDoctor(
                first_name=fullname_parts[0],
                middle_name=fullname_parts[1] if len(fullname_parts) >= 3 else "",
                last_name=fullname_parts[2] if len(fullname_parts) >= 3 else fullname_parts[1],
                role=UserRole.VOLUNTEER_DOCTOR,
                email=f"{fullname.lower()}@gmail.com",
                hashed_password=password_hasher.hash(fullname),
                mcr_no=mcr_pool.pop(),
                specialisation=random.choice(specialisations),
                created_at=faker.date_time_between(start_date="-3y", end_date="now"),
            )
            db.add(doctor)
            db.flush()

            # Random image from "qualifications" folder
            qualification_img_filepath = random.choice(list(pathlib.Path(qualifications_img_folder).iterdir()))
            qualification_s3_key = S3StorageInterface.put_qualification_img_from_filepath(
                doctor.id, str(qualification_img_filepath)
            )
            if qualification_s3_key is None:
                raise ValueError("Failed to upload medical degree image to S3 storage")
            doctor.qualification_img_key = qualification_s3_key

            # Assign the profile picture
            profile_img_filepath = str(folder_item)
            profile_s3_key = S3StorageInterface.put_profile_img_from_filepath(doctor.id, profile_img_filepath)
            if profile_s3_key is None:
                raise ValueError("Failed to upload profile image to S3 storage")
            doctor.profile_img_key = profile_s3_key

            all_doctors.append(doctor)
        return all_doctors

    @staticmethod
    def generate_nutritionists(
        db: Session,
        faker: Faker,
        password_hasher: PasswordHasher,
        profile_img_folder: str,
        qualifications_img_folder: str,
    ) -> list[Nutritionist]:
        if not os.path.exists(profile_img_folder):
            raise ValueError(f"Profile image folder does not exist: {profile_img_folder}")
        if not os.path.exists(qualifications_img_folder):
            raise ValueError(f"Profile image folder does not exist: {qualifications_img_folder}")

        print("Generating Users (Nutritionists)....")
        all_nutritionists: list[Nutritionist] = []
        for folder_item in pathlib.Path(profile_img_folder).iterdir():
            if not folder_item.is_file():
                continue
            if not folder_item.name.lower().endswith((".png", ".jpg", ".jpeg")):
                continue

            fullname = folder_item.stem
            fullname_parts = fullname.split("_")

            # qualification = NutritionistQualification(
            #     qualification_img_key="",  # Empty, for now.....
            #     # qualification_option=random.choice(list(NutritionistQualificationOption)),
            # )
            nutritionist = Nutritionist(
                first_name=fullname_parts[0],
                middle_name=fullname_parts[1] if len(fullname_parts) >= 3 else "",
                last_name=fullname_parts[2] if len(fullname_parts) >= 3 else fullname_parts[1],
                role=UserRole.NUTRITIONIST,
                email=f"{fullname.lower()}@gmail.com",
                hashed_password=password_hasher.hash(fullname),
                created_at=faker.date_time_between(start_date="-3y", end_date="now"),
            )
            db.add(nutritionist)
            db.flush()

            # Random image from "qualifications" img folder
            qualification_img_filepath = random.choice(list(pathlib.Path(qualifications_img_folder).iterdir()))
            qualification_s3_key = S3StorageInterface.put_qualification_img_from_filepath(
                nutritionist.id, str(qualification_img_filepath)
            )
            if qualification_s3_key is None:
                raise ValueError("Failed to upload medical degree image to S3 storage")
            nutritionist.qualification_img_key = qualification_s3_key

            # Assign the profile picture
            profile_img_filepath = str(folder_item)
            profile_s3_key = S3StorageInterface.put_profile_img_from_filepath(nutritionist.id, profile_img_filepath)
            if profile_s3_key is None:
                raise ValueError("Failed to upload profile image to S3 storage")
            nutritionist.profile_img_key = profile_s3_key

            all_nutritionists.append(nutritionist)
        return all_nutritionists

    @staticmethod
    def generate_merchants(
        db: Session, faker: Faker, password_hasher: PasswordHasher, profile_img_folder: str
    ) -> list[Merchant]:
        if not os.path.exists(profile_img_folder):
            raise ValueError(f"Profile image folder does not exist: {profile_img_folder}")

        print("Generating users (Merchants)....")
        all_merchants: list[Merchant] = []
        for folder_item in pathlib.Path(profile_img_folder).iterdir():
            if not folder_item.is_file():
                continue
            if not folder_item.name.lower().endswith((".png", ".jpg", ".jpeg")):
                continue

            fake_created_at: datetime = faker.date_time_between(start_date="-3y", end_date="now")
            full_name: str = folder_item.stem  # Exclude the extension
            fullname_parts: list[str] = full_name.split("_")

            merchant = Merchant(
                first_name=fullname_parts[0],
                middle_name=fullname_parts[1] if len(fullname_parts) >= 3 else "",
                last_name=fullname_parts[2] if len(fullname_parts) >= 3 else fullname_parts[1],
                role=UserRole.MERCHANT,
                created_at=fake_created_at,
                email=f"{full_name.lower()}@gmail.com",
                hashed_password=password_hasher.hash(full_name),
            )
            db.add(merchant)
            db.flush()

            # Assign profile image
            profile_img_key = S3StorageInterface.put_profile_img_from_filepath(merchant.id, str(folder_item))
            merchant.profile_img_key = profile_img_key
            all_merchants.append(merchant)
        return all_merchants

    @staticmethod
    def generate_admins(db: Session, faker: Faker, password_hasher: PasswordHasher, admins_json: str) -> list[Admin]:
        print("Generating users (Admins)....")

        all_admins: list[Admin] = []
        with open(admins_json, "r", encoding="utf-8") as f:
            admin_fullnames = json.load(f)
            for fullname_space_delim in admin_fullnames:
                fullname_underscore_delim = fullname_space_delim.replace(" ", "_")
                name_parts = fullname_underscore_delim.split("_")
                assert len(name_parts) == 2, f"Full name must have ONLY first and last name: {fullname_space_delim}"

                admin = Admin(
                    first_name=name_parts[0],
                    last_name=name_parts[1],
                    role=UserRole.ADMIN,
                    email=f"{fullname_underscore_delim.lower()}@gmail.com",
                    hashed_password=password_hasher.hash(fullname_underscore_delim),
                    created_at=faker.date_time_between(start_date="-3y", end_date="now"),
                    is_superuser=True,
                )
                all_admins.append(admin)

        db.add_all(all_admins)
        db.flush()
        return all_admins

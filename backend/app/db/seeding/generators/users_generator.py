import os
import pathlib
import random
from datetime import datetime, timedelta

from argon2 import PasswordHasher
from faker import Faker
from sqlalchemy.orm import Session

from app.db.db_schema import (
    MCRNumber,
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
                email=f"{full_name}@gmail.com",
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
                email=f"{fullname}@gmail.com",
                hashed_password=password_hasher.hash(fullname),
                mcr_no=mcr_pool.pop(),
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
                email=f"{fullname}@gmail.com",
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

    # @staticmethod
    # def generate_admins(
    #     db: Session, faker: Faker, password_hasher: PasswordHasher, count: int
    # ) -> list[Admin]:
    #     print("Generating users (Admins)....")
    #
    #     admin_role: Role | None = db.query(Role).filter(Role.label == "Admin").first()
    #     if admin_role is None:
    #         raise RoleNotFound("Admin")
    #
    #     all_admins: list[Admin] = []
    #     fake_usernames: set[str] = UsersGenerator._create_unique_usernames(db, faker, count)
    #     for username in fake_usernames:
    #         admin = Admin(
    #             username=username,
    #             role=admin_role,
    #             email=f'{username}@gmail.com',
    #             hashed_password=password_hasher.hash(username),
    #             created_at=faker.date_time_between(start_date="-3y", end_date="now"),
    #         )
    #         db.add(admin)
    #         all_admins.append(admin)
    #     db.commit()
    #     return all_admins

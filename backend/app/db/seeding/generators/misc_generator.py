import json
import random
from datetime import datetime, timedelta
from pathlib import Path

from faker import Faker
from sqlalchemy.orm import Session
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

from app.core.custom_base_model import CustomBaseModel
from app.db.db_schema import (
    Appointment,
    AppointmentStatus,
    DoctorRating,
    DoctorSpecialisation,
    KickTrackerDataPoint,
    KickTrackerSession,
    MCRNumber,
    Merchant,
    MotherLikeProduct,
    PregnantWoman,
    Product,
    ProductCategory,
    SavedVolunteerDoctor,
    User,
    UserAppFeedback,
    VolunteerDoctor,
)
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import generate_unique_mcr_numbers


class ProductModel(CustomBaseModel):
    name: str
    category: str
    price_cents: int
    description: str
    photo_url: str


class MiscGenerator:
    @staticmethod
    def generate_doctor_specialisations(db: Session) -> list[DoctorSpecialisation]:
        print("Generating doctor specialisations....")

        specialisations = [
            "Obstetrics and Gynaecology",
            "Maternal-Fetal Medicine",
            "High-Risk Pregnancy",
            "Reproductive Endocrinology",
            "Prenatal Care",
            "Perinatal Medicine",
            "General Practitioner",
            "Family Medicine",
            "Internal Medicine",
            "Midwifery",
        ]

        specialisation_objs = [DoctorSpecialisation(specialisation=spec) for spec in specialisations]
        db.add_all(specialisation_objs)
        db.flush()
        return specialisation_objs

    @staticmethod
    def generate_user_app_feedback(db: Session, faker: Faker, all_users: list[User], fraction_of_mothers: float):
        print("Generating user app feedback....")

        sia = SentimentIntensityAnalyzer()

        sample_size: int = int(len(all_users) * max(min(fraction_of_mothers, 1), 0))
        rand_users: list[User] = random.sample(population=all_users, k=sample_size)
        for user in rand_users:
            feedback_content = faker.sentence(random.randint(1, 5))

            # Analyze sentiment using VADER
            sentiment_scores = sia.polarity_scores(feedback_content)

            user_feedback = UserAppFeedback(
                author=user,
                rating=random.randint(1, 5),
                content=feedback_content,
                positive_score=sentiment_scores["pos"],
                neutral_score=sentiment_scores["neu"],
                negative_score=sentiment_scores["neg"],
                compound_score=sentiment_scores["compound"],
            )
            db.add(user_feedback)

    @staticmethod
    def generate_appointments(
        db: Session,
        faker: Faker,
        all_doctors: list[VolunteerDoctor],
        all_mothers: list[PregnantWoman],
    ):
        print("Generating appointments....")

        # mothers_sample_size = int(len(all_mothers) * max(min(fraction_of_mothers, 1), 0))
        # mothers_sample: list[PregnantWoman] = random.sample(population=all_mothers, k=mothers_sample_size)
        for mother in all_mothers:
            appointment_count: int = random.randint(5, 15)
            for _ in range(appointment_count):
                now = datetime.now()
                offset = timedelta(days=random.randint(1, 60))  # Appoints +/- 60 days from now

                rand_time: datetime = faker.date_time_between(
                    start_date=now - offset,
                    end_date=now + offset,
                )
                db.add(
                    Appointment(
                        volunteer_doctor=random.choice(all_doctors),
                        mother=mother,
                        start_time=rand_time,
                        status=random.choice(list(AppointmentStatus)),
                    )
                )

    @staticmethod
    def generate_kick_tracker_sessions(
        db: Session, faker: Faker, all_mothers: list[PregnantWoman]
    ) -> list[KickTrackerSession]:
        print("Generating kick tracker sessions....")

        sample_size: int = random.randint(0, len(all_mothers))
        mothers_sample: list[PregnantWoman] = random.sample(population=all_mothers, k=sample_size)

        kick_tracker_sessions: list[KickTrackerSession] = []
        for mother in mothers_sample:
            rand_session_count: int = random.randint(1, 5)
            for _ in range(rand_session_count):
                session_start: datetime = faker.date_time_between(
                    start_date=mother.created_at, end_date=datetime.now() - timedelta(days=1)
                )

                kick_session = KickTrackerSession(
                    mother=mother,
                    started_at=session_start,
                    ended_at=session_start + timedelta(minutes=random.randint(30, 150)),
                )

                rand_kick_count: int = random.randint(1, 18)
                for _ in range(rand_kick_count):
                    random_kick = KickTrackerDataPoint(
                        kick_at=faker.date_time_between(
                            start_date=kick_session.started_at, end_date=kick_session.ended_at
                        ),
                        session=kick_session,
                    )
                    kick_session.kicks.append(random_kick)
                kick_tracker_sessions.append(kick_session)

        db.add_all(kick_tracker_sessions)
        return kick_tracker_sessions

    @staticmethod
    def generate_mcr_numbers(db_session: Session, size: int) -> list[MCRNumber]:
        print("Generating MCR Numbers.....")
        mcr_numbers = [MCRNumber(value=mcr_no) for mcr_no in generate_unique_mcr_numbers(size=size)]
        db_session.add_all(mcr_numbers)
        return mcr_numbers

    @staticmethod
    def generate_mother_save_doctor(
        db: Session, all_mothers: list[PregnantWoman], all_doctors: list[VolunteerDoctor]
    ) -> None:
        print("Generating 'mother save doctors' entries....")

        mother_save_doctor: list[SavedVolunteerDoctor] = []
        for doctor in all_doctors:
            mothers_sample_size = random.randint(0, len(all_mothers) // 2)
            mothers_sample: list[PregnantWoman] = random.sample(population=all_mothers, k=mothers_sample_size)
            for mother in mothers_sample:
                save_entry = SavedVolunteerDoctor(mother=mother, volunteer_doctor=doctor)
                mother_save_doctor.append(save_entry)

        db.add_all(mother_save_doctor)

    @staticmethod
    def generate_doctor_ratings(
        db: Session, all_mothers: list[PregnantWoman], all_doctors: list[VolunteerDoctor]
    ) -> None:
        print("Generating doctor ratings.....")

        doctor_ratings: list[DoctorRating] = []
        for doctor in all_doctors:
            mothers_sample_size = random.randint(0, len(all_mothers) // 2)
            mothers_sample: list[PregnantWoman] = random.sample(population=all_mothers, k=mothers_sample_size)
            for mother in mothers_sample:
                rating_entry = DoctorRating(rater=mother, doctor=doctor, rating=random.randint(1, 5))
                doctor_ratings.append(rating_entry)
        db.add_all(doctor_ratings)

    @staticmethod
    def generate_baby_products(db: Session, all_merchants: list[Merchant], products_data_path: str):
        print("Generating baby products.....")

        # --------- Validate file path and JSON structure ---------
        products_data_file = Path(products_data_path)

        if not products_data_file.exists():
            raise FileNotFoundError(f"Products data file not found: {products_data_path}")

        if not products_data_file.is_file():
            raise ValueError(f"Products data path is not a file: {products_data_path}")

        if products_data_file.suffix.lower() != ".json":
            raise ValueError(f"Products data file must be a JSON file, got: {products_data_file.suffix}")

        # --------- Load and validate JSON data ---------
        products_path: Path = products_data_file.parent
        try:
            with open(products_data_file, "r", encoding="utf-8") as f:
                raw_products_data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(f"Products data file not found: {products_data_path}")
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format in file: {products_data_path}. Error: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error reading products data file: {str(e)}")

        # --------- Validate data is a list ---------
        if not isinstance(raw_products_data, list):
            raise ValueError(f"Products data must be a JSON array, got: {type(raw_products_data).__name__}")

        if len(raw_products_data) == 0:
            raise ValueError("Products data file is empty")

        # --------- Validate each product's structure ---------
        products_data: list[ProductModel] = []
        for idx, product_item in enumerate(raw_products_data):
            try:
                product_model = ProductModel(**product_item)

                # Additional validation
                if product_model.price_cents < 0:
                    raise ValueError(f"Product at index {idx}: price_cents must be non-negative")

                if not product_model.name.strip():
                    raise ValueError(f"Product at index {idx}: name cannot be empty")

                if not product_model.category.strip():
                    raise ValueError(f"Product at index {idx}: category cannot be empty")

                if not product_model.description.strip():
                    raise ValueError(f"Product at index {idx}: description cannot be empty")

                if not product_model.photo_url.strip():
                    raise ValueError(f"Product at index {idx}: photo_url cannot be empty")

                products_data.append(product_model)
            except TypeError as e:
                raise ValueError(f"Product at index {idx}: Missing required fields. Error: {str(e)}")
            except Exception as e:
                raise ValueError(f"Product at index {idx}: Invalid data structure. Error: {str(e)}")

        # --------- Validate that all image files exist ---------
        missing_images: list[str] = []
        for idx, product in enumerate(products_data):
            photo_filename = product.photo_url
            if photo_filename:
                image_path = products_path / photo_filename
                if not image_path.is_file():
                    missing_images.append(f"{photo_filename} (product index {idx})")

        if missing_images:
            missing_count = len(missing_images)
            raise FileNotFoundError(
                f"FATAL ERROR: Found {missing_count} missing image file(s) in directory '{products_path}'. "
                f"Missing files: {', '.join(missing_images[:5])}{'...' if missing_count > 5 else ''}"
            )

        # --------- Check for merchants ---------
        if not all_merchants or len(all_merchants) == 0:
            raise ValueError("No merchants available to assign products to")

        # --------- Continue with seeding logic ---------
        all_products: list[Product] = []
        all_product_categories: dict[str, ProductCategory] = {}

        for product_json in products_data:
            # Get or create category
            category_name = product_json.category
            if category_name not in all_product_categories:
                all_product_categories[category_name] = ProductCategory(label=category_name)
            category_obj = all_product_categories[category_name]

            # Create new product
            new_product = Product(
                name=product_json.name,
                merchant=random.choice(all_merchants),
                category=category_obj,
                price_cents=product_json.price_cents,
                description=product_json.description,
            )

            db.add(new_product)
            db.flush()

            # Upload image to S3
            img_key = S3StorageInterface.put_product_img_from_filepath(
                new_product.id, str(products_path / product_json.photo_url)
            )

            if img_key is None:
                raise ValueError(f"Failed to upload image for product '{new_product.name}'")

            new_product.img_key = img_key
            all_products.append(new_product)

        print(
            f"Successfully generated {len(all_products)} baby products across {len(all_product_categories)} categories"
        )
        db.add_all(all_products)
        return all_products

    @staticmethod
    def generate_mother_like_product(
        db: Session, all_mothers: list[PregnantWoman], all_products: list[Product]
    ) -> None:
        print("Generating 'mother likes product' entries....")
        for mother in all_mothers:
            products_sample_size: int = random.randint(1, len(all_products) // 4)
            products_sample: list[Product] = random.sample(population=all_products, k=products_sample_size)
            for product in products_sample:
                like = MotherLikeProduct(mother=mother, product=product)
                db.add(like)

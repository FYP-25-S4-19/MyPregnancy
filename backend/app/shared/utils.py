import random
import string

from fastapi import UploadFile
from PIL import Image, UnidentifiedImageError
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.db_schema import User


def clear_db(db: Session):
    print("Clearing the database....\n")
    db.execute(text("SET session_replication_role = 'replica';"))  # Disable foreign key constraints

    table_names = db.execute(text("SELECT tablename FROM pg_tables WHERE schemaname='public';")).scalars().all()
    for table in table_names:  # Truncate all tables
        if table not in ["alembic_version"]:
            db.execute(text(f"TRUNCATE TABLE {table} RESTART IDENTITY CASCADE;"))

    db.execute(text("SET session_replication_role = 'origin';"))  # Re-enable foreign key constraints
    db.commit()


def is_valid_image(upload_file: UploadFile) -> bool:
    try:
        Image.open(upload_file.file)
        upload_file.file.seek(0)
        return True
    except UnidentifiedImageError:
        upload_file.file.seek(0)
        return False


def format_user_fullname(user: User) -> str:
    return " ".join(name_part for name_part in [user.first_name, user.middle_name, user.last_name] if name_part).strip()


def generate_mcr_like_string() -> str:
    digit_count: int = random.choice([4, 5])
    digits: str = "".join(random.choices(string.digits, k=digit_count))
    suffix: str = random.choice(string.ascii_uppercase)
    return "M" + digits + suffix


def generate_unique_mcr_numbers(size: int) -> list[str]:
    mcr_numbers: set[str] = set()
    while len(mcr_numbers) < size:
        mcr_numbers.add(generate_mcr_like_string())
    return list(mcr_numbers)

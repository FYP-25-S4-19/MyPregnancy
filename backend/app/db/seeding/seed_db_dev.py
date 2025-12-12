from faker import Faker
from sqlalchemy.orm import Session

from app.core.password_hasher import get_password_hasher
from app.db.db_config import SessionLocal
from app.db.db_schema import (
    CommunityThread,
    EduArticle,
    JournalEntry,
    MCRNumber,
    Nutritionist,
    PregnantWoman,
    ThreadCategory,
    ThreadComment,
    User,
    VolunteerDoctor,
)
from app.db.seeding.generators.community_thread_generator import CommunityThreadGenerator
from app.db.seeding.generators.defaults_generator import DefaultsGenerator
from app.db.seeding.generators.edu_articles_generator import EduArticlesGenerator
from app.db.seeding.generators.journal_and_metrics_generator import JournalAndMetricsGenerator
from app.db.seeding.generators.misc_generator import MiscGenerator
from app.db.seeding.generators.recipes_generator import RecipesGenerator
from app.db.seeding.generators.users_generator import UsersGenerator
from app.shared.utils import clear_db

if __name__ == "__main__":
    db_session: Session = SessionLocal()
    try:
        faker = Faker()
        password_hasher = get_password_hasher()
        clear_db(db_session)

        # ------- Initialize defaults -------
        binary_metrics, scalar_metrics = DefaultsGenerator.generate_defaults(db_session)
        print("Finished seeding the database defaults!\n")

        # The number of MCR numbers to generate for doctor users
        # Must make sure it ('size' param) is set to a sufficiently large to avoid running out of unique MCR numbers
        #
        # Otherwise, will probably throw an error
        # The rest of the remaining MCR numbers that are not used in the seeding process will just be available
        # for future use in the API endpoints for validating whether an MCR number is valid or not
        available_mcr_numbers: list[MCRNumber] = MiscGenerator.generate_mcr_numbers(db_session, 1500)

        # --------- Generate users ---------
        QUALIFICATION_FILEPATH = "./seed_data/qualifications"
        preg_women: list[PregnantWoman] = UsersGenerator.generate_pregnant_women(
            db_session, faker, password_hasher, "./seed_data/profiles/pregnant_women"
        )
        doctors: list[VolunteerDoctor] = UsersGenerator.generate_volunteer_doctors(
            db_session,
            faker,
            password_hasher,
            "./seed_data/profiles/volunteer_doctors",
            QUALIFICATION_FILEPATH,
            available_mcr_numbers,
        )
        nutritionists: list[Nutritionist] = UsersGenerator.generate_nutritionists(
            db_session,
            faker,
            password_hasher,
            "./seed_data/profiles/nutritionists",
            QUALIFICATION_FILEPATH,
        )
        all_users: list[User] = preg_women + doctors + nutritionists
        print("Finished seeding the database users!\n")

        # ------- Generate Community Thread --------
        all_thread_categories: list[ThreadCategory] = CommunityThreadGenerator.generate_thread_categories(db_session)
        all_community_threads: list[CommunityThread] = CommunityThreadGenerator.generate_threads(
            db_session, faker, all_users, all_thread_categories, 35
        )
        all_thread_comments: list[ThreadComment] = CommunityThreadGenerator.generate_thread_comments(
            db_session, faker, all_users, all_community_threads, 25
        )
        CommunityThreadGenerator.generate_comment_likes(db_session, preg_women, all_thread_comments)
        print("Finished seeding forum content!\n")

        # ---- Generation of journal entries (and corresponding 'random' metric logs) -----
        journal_entries: list[JournalEntry] = JournalAndMetricsGenerator.generate_journal_entries(
            db_session, faker, preg_women, 12
        )
        JournalAndMetricsGenerator.generate_journal_metric_logs(
            db_session, journal_entries, binary_metrics, scalar_metrics
        )
        print("Finished seeding metric logs (binary, scalar, BP)!\n")

        # ------ Generation of educational articles ---------
        edu_articles: list[EduArticle] = EduArticlesGenerator.generate_edu_articles(db_session, faker, 40)
        EduArticlesGenerator.generate_saved_edu_articles(db_session, edu_articles, preg_women)
        print("Finished seeding educational article content!\n")

        # -------- Generation of recipe data ---------
        RecipesGenerator.generate_all_recipes(db_session, preg_women, nutritionists, "./seed_data/recipes/_data.json")
        print("Finished seeding all recipes!\n")

        # ------- Generation of miscellaneous content -------
        MiscGenerator.generate_user_app_feedback(db_session, faker, all_users, 0.25)
        MiscGenerator.generate_kick_tracker_sessions(db_session, faker, preg_women)
        # MiscGenerator.generate_appointments(db_session, faker, doctors, preg_women, 0.7)
        MiscGenerator.generate_doctor_ratings(db_session, preg_women, doctors)
        MiscGenerator.generate_mother_save_doctor(db_session, preg_women, doctors)
        print("Finished seeding miscellaneous content!\n")

        db_session.commit()
        print("Finished seeding the database!")
    except Exception as e:
        db_session.rollback()
        print(f"Exception occurred while seeding database: {e}")
    finally:
        db_session.close()

from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum

from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import (
    DateTime,
    ForeignKey,
    String,
    Text,
    func,
    text,
)
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AppointmentStatus(Enum):
    PENDING_ACCEPT_REJECT = "PENDING_ACCEPT_REJECT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class AccountCreationRequestStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class UserRole(Enum):
    ADMIN = "ADMIN"
    VOLUNTEER_DOCTOR = "VOLUNTEER_DOCTOR"
    PREGNANT_WOMAN = "PREGNANT_WOMAN"
    NUTRITIONIST = "NUTRITIONIST"


class BinaryMetricCategory(Enum):
    MOOD = "MOOD"
    SYMPTOMS = "SYMPTOMS"
    APPETITE = "APPETITE"
    DIGESTION = "DIGESTION"
    SWELLING = "SWELLING"
    PHYSICAL_ACTIVITY = "PHYSICAL_ACTIVITY"
    OTHERS = "OTHERS"


class EduArticleCategory(Enum):
    NUTRITION = "NUTRITION"
    BODY = "BODY"
    BABY = "BABY"
    FEEL_GOOD = "FEEL_GOOD"
    MEDICAL = "MEDICAL"
    EXERCISE = "EXERCISE"
    LABOUR = "LABOUR"
    LIFESTYLE = "LIFESTYLE"
    RELATIONSHIPS = "RELATIONSHIPS"


class NotificationType(Enum):
    THREAD_LIKE = "THREAD_LIKE"  # Someone liked a thread you made
    THREAD_COMMENT = "THREAD_COMMENT"  # Someone commented on a thread you made
    COMMENT_LIKE = "COMMENT_LIKE"  # Someone liked a comment you wrote
    COMMENT_REPLY = "COMMENT_REPLY"  # Someone replied to a comment you wrote
    NEW_ARTICLE = "NEW_ARTICLE"  # A new article (that you might like) was posted
    APPOINTMENT_REMINDER = "APPOINTMENT_REMINDER"
    APPOINTMENT_REQUEST = "APPOINTMENT_REQUEST"
    PRIVATE_MESSAGE = "PRIVATE_MESSAGE"


# ===========================================
# ============= GENERAL USER ================
# ===========================================
class User(SQLAlchemyBaseUserTableUUID, Base):
    __tablename__ = "users"
    __mapper_args__ = {"polymorphic_identity": "user", "polymorphic_on": "type"}
    type: Mapped[str]

    profile_img_key: Mapped[str | None]

    first_name: Mapped[str] = mapped_column(String(64))
    middle_name: Mapped[str | None] = mapped_column(String(64))  # Middle name optional
    last_name: Mapped[str] = mapped_column(String(64))

    role: Mapped["UserRole"] = mapped_column(SQLAlchemyEnum(UserRole))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    threads_created: Mapped[list["CommunityThread"]] = relationship(back_populates="creator")
    thread_comments: Mapped[list["ThreadComment"]] = relationship(back_populates="commenter")
    threads_liked: Mapped[list["CommunityThreadLike"]] = relationship(back_populates="liker")
    comments_liked: Mapped[list["CommentLike"]] = relationship(back_populates="liker")

    feedback_given: Mapped["UserAppFeedback"] = relationship(back_populates="author")
    saved_edu_articles: Mapped[list["SavedEduArticle"]] = relationship(back_populates="saver")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="recipient")
    saved_recipes: Mapped[list["SavedRecipe"]] = relationship(back_populates="saver")


class Admin(User):
    __tablename__ = "admins"
    __mapper_args__ = {"polymorphic_identity": "admin"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore


class VolunteerDoctor(User):
    __tablename__ = "volunteer_doctors"
    __mapper_args__ = {"polymorphic_identity": "volunteer_doctor"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore

    mcr_no_id: Mapped[int] = mapped_column(ForeignKey("mcr_numbers.id"))
    mcr_no: Mapped["MCRNumber"] = relationship(back_populates="doctor")

    qualification_img_key: Mapped[str | None]

    # Keep track of the "Pregnant Women" who have "saved" you
    saved_by: Mapped[list["SavedVolunteerDoctor"]] = relationship(back_populates="volunteer_doctor")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="volunteer_doctor")

    articles_written: Mapped[list["EduArticle"]] = relationship(back_populates="author")
    doctor_ratings: Mapped[list["DoctorRating"]] = relationship(back_populates="doctor")


class PregnantWoman(User):
    __tablename__ = "pregnant_women"
    __mapper_args__ = {"polymorphic_identity": "pregnant_woman"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore

    due_date: Mapped[date | None]  # Nullable (may not be expecting)
    date_of_birth: Mapped[date]

    saved_volunteer_doctors: Mapped[list["SavedVolunteerDoctor"]] = relationship(back_populates="mother")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="mother")
    journal_entries: Mapped[list["JournalEntry"]] = relationship(back_populates="author")
    kick_tracker_sessions: Mapped[list["KickTrackerSession"]] = relationship(back_populates="mother")
    doctor_ratings: Mapped[list["DoctorRating"]] = relationship(back_populates="rater")


class Nutritionist(User):
    __tablename__ = "nutritionists"
    __mapper_args__ = {"polymorphic_identity": "nutritionist"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore

    qualification_img_key: Mapped[str | None]
    recipes_created: Mapped[list["Recipe"]] = relationship(back_populates="nutritionist")


# ===========================================================
# ==================== QUALIFICATIONS =======================
# ===========================================================


# The actual INSTANCES of "Medical Qualification" - Each VolunteerDoctor should have one!
# class DoctorQualification(Base):
#     __tablename__ = "doctor_qualifications"
#     id: Mapped[int] = mapped_column(primary_key=True)
#     qualification_img_key: Mapped[str]
#     # qualification_option: Mapped["DoctorQualificationOption"] = mapped_column(SQLAlchemyEnum(DoctorQualificationOption))

#     # The specific "doctor" that this credential is mapped to
#     doctor: Mapped["VolunteerDoctor"] = relationship(back_populates="qualification")


# The actual INSTANCES of "Nutritionist Qualification" - Each Nutritionist should have one!
# class NutritionistQualification(Base):
#     __tablename__ = "nutritionist_qualifications"
#     id: Mapped[int] = mapped_column(primary_key=True)
#     qualification_img_key: Mapped[str]
#     # qualification_option: Mapped["NutritionistQualificationOption"] = mapped_column(
#     #     SQLAlchemyEnum(NutritionistQualificationOption)
#     # )

#     # The specific "nutritionist" that this credential is mapped to
#     nutritionist: Mapped["Nutritionist"] = relationship(back_populates="qualification")


# ===========================================================
# ================== EDUCATIONAL CONTENT ====================
# ===========================================================
class EduArticle(Base):
    __tablename__ = "edu_articles"
    id: Mapped[int] = mapped_column(primary_key=True)

    # >Nullable
    # Just in case we pull external articles, and they DON'T link
    # to one of the Doctors within our database
    author_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("volunteer_doctors.id"))
    author: Mapped["VolunteerDoctor"] = relationship(back_populates="articles_written")

    # Each article has exactly 1 category (for now)
    category: Mapped["EduArticleCategory"] = mapped_column(SQLAlchemyEnum(EduArticleCategory))

    img_key: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255), unique=True)
    content_markdown: Mapped[str] = mapped_column(Text)

    # Keep track of which users "saved" you
    saved_edu_articles: Mapped[list["SavedEduArticle"]] = relationship(back_populates="article")


class SavedEduArticle(Base):
    __tablename__ = "saved_edu_articles"
    saver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    saver: Mapped["User"] = relationship(back_populates="saved_edu_articles")

    article_id: Mapped[int] = mapped_column(ForeignKey("edu_articles.id"), primary_key=True)
    article: Mapped["EduArticle"] = relationship(back_populates="saved_edu_articles")


# ========================================================
# ================ MISC ASSOC TABLES =====================
# ========================================================
class DoctorRating(Base):
    __tablename__ = "doctor_ratings"

    rater_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"), primary_key=True)
    rater: Mapped["PregnantWoman"] = relationship(back_populates="doctor_ratings")

    doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("volunteer_doctors.id"), primary_key=True)
    doctor: Mapped["VolunteerDoctor"] = relationship(back_populates="doctor_ratings")

    rating: Mapped[int]


# Association table for a "Pregnant Woman" who saves a "Volunteer Doctor"
# Composite primary key
class SavedVolunteerDoctor(Base):
    __tablename__ = "saved_volunteer_doctors"

    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"), primary_key=True)
    mother: Mapped["PregnantWoman"] = relationship(back_populates="saved_volunteer_doctors")

    volunteer_doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("volunteer_doctors.id"), primary_key=True)
    volunteer_doctor: Mapped["VolunteerDoctor"] = relationship(back_populates="saved_by")


# Association table for a "Pregnant Woman" who creates an "appointment request"
class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[uuid.UUID] = mapped_column(PgUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    volunteer_doctor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("volunteer_doctors.id"))
    volunteer_doctor: Mapped[VolunteerDoctor] = relationship(back_populates="appointments")

    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"))
    mother: Mapped[PregnantWoman] = relationship(back_populates="appointments")

    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[AppointmentStatus] = mapped_column(SQLAlchemyEnum(AppointmentStatus))


# ===========================================================
# ========== JOURNAL | METRICS (MOOD, SYMPTOM) ==============
# ===========================================================
class BinaryMetric(Base):
    __tablename__ = "binary_metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(255), unique=True)

    # Each "Metric Option" will have a "Metric Category".
    # "Happy" -> Mood
    # "Leg cramps" -> Symptoms
    # etc....
    # category_id: Mapped[int] = mapped_column(ForeignKey("binary_metric_categories.id"))
    category: Mapped["BinaryMetricCategory"] = mapped_column(SQLAlchemyEnum(BinaryMetricCategory))

    # The "Metric Logs" in "Journal Entries" that are making use of the current option
    journal_binary_metric_logs: Mapped[list["JournalBinaryMetricLog"]] = relationship(back_populates="binary_metric")


class JournalEntry(Base):
    __tablename__ = "journal_entries"
    id: Mapped[int] = mapped_column(primary_key=True)

    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"))
    author: Mapped["PregnantWoman"] = relationship(back_populates="journal_entries")

    content: Mapped[str] = mapped_column(Text)
    logged_on: Mapped[date] = mapped_column(index=True)

    # Since this is the only metric that is composed of multiple values,
    # I'll just put it directly here for simplicity (as opposed to have a dedicated table)
    systolic: Mapped[int] = mapped_column(server_default=text("0"))
    diastolic: Mapped[int] = mapped_column(server_default=text("0"))

    # NOTE: The actual chosen options are inside each "Metric Log"
    journal_binary_metric_logs: Mapped[list["JournalBinaryMetricLog"]] = relationship(
        back_populates="journal_entry", cascade="all, delete-orphan"
    )
    journal_scalar_metric_logs: Mapped[list["JournalScalarMetricLog"]] = relationship(
        back_populates="journal_entry", cascade="all, delete-orphan"
    )


# Association table associating a "Journal Entry" with a "Binary Metric"
# i.e. Everytime you log a "Journal Entry", you may have multiple "Binary Metrics" associated with it
#
# Composite primary key
class JournalBinaryMetricLog(Base):
    __tablename__ = "journal_binary_metric_logs"

    journal_entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id"), primary_key=True)
    journal_entry: Mapped["JournalEntry"] = relationship(back_populates="journal_binary_metric_logs")

    binary_metric_id: Mapped[int] = mapped_column(ForeignKey("binary_metrics.id"), primary_key=True)
    binary_metric: Mapped["BinaryMetric"] = relationship(back_populates="journal_binary_metric_logs")


class ScalarMetric(Base):
    __tablename__ = "scalar_metrics"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(128), unique=True)
    unit_of_measurement: Mapped[str] = mapped_column(String(128), unique=True)  # Systolic, Litres, Kilograms, etc...
    journal_scalar_metric_logs: Mapped[list["JournalScalarMetricLog"]] = relationship(back_populates="scalar_metric")


class JournalScalarMetricLog(Base):
    __tablename__ = "journal_scalar_metric_logs"

    journal_entry_id: Mapped[int] = mapped_column(ForeignKey("journal_entries.id"), primary_key=True)
    journal_entry: Mapped["JournalEntry"] = relationship(back_populates="journal_scalar_metric_logs")

    scalar_metric_id: Mapped[int] = mapped_column(ForeignKey("scalar_metrics.id"), primary_key=True)
    scalar_metric: Mapped["ScalarMetric"] = relationship(back_populates="journal_scalar_metric_logs")

    value: Mapped[float]


# ===========================================================
# ==================== COMMUNITY FORUM ======================
# ===========================================================
class ThreadCategory(Base):
    __tablename__ = "thread_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(64), unique=True)
    thread_category_associations: Mapped[list["ThreadCategoryAssociation"]] = relationship(back_populates="category")


# A 'thread' is what you would usually call a 'forum post'
#
# I hesitated to call it 'post', just because of possible weird names that would
# potentially arise when having to use this in conjunction with the HTTP "POST" method
class CommunityThread(Base):
    __tablename__ = "community_threads"
    id: Mapped[int] = mapped_column(primary_key=True)

    creator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    creator: Mapped["User"] = relationship(back_populates="threads_created")

    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    comments: Mapped[list["ThreadComment"]] = relationship(back_populates="thread")
    community_thread_likes: Mapped[list["CommunityThreadLike"]] = relationship(back_populates="thread")

    thread_category_associations: Mapped[list["ThreadCategoryAssociation"]] = relationship(back_populates="thread")


class ThreadCategoryAssociation(Base):
    __tablename__ = "thread_category_associations"

    thread_id: Mapped[int] = mapped_column(ForeignKey("community_threads.id"), primary_key=True)
    thread: Mapped[CommunityThread] = relationship(back_populates="thread_category_associations")

    category_id: Mapped[int] = mapped_column(ForeignKey("thread_categories.id"), primary_key=True)
    category: Mapped[ThreadCategory] = relationship(back_populates="thread_category_associations")


# An association table for when a "user" likes a "community thread"
class CommunityThreadLike(Base):
    __tablename__ = "community_thread_likes"

    liker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    liker: Mapped["User"] = relationship(back_populates="threads_liked")

    thread_id: Mapped[int] = mapped_column(ForeignKey("community_threads.id"), primary_key=True)
    thread: Mapped["CommunityThread"] = relationship(back_populates="community_thread_likes")


class ThreadComment(Base):
    __tablename__ = "thread_comments"
    id: Mapped[int] = mapped_column(primary_key=True)

    thread_id: Mapped[int] = mapped_column(ForeignKey("community_threads.id"))
    thread: Mapped["CommunityThread"] = relationship(back_populates="comments")

    commenter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    commenter: Mapped["User"] = relationship(back_populates="thread_comments")

    commented_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    content: Mapped[str] = mapped_column(Text)

    comment_likes: Mapped[list["CommentLike"]] = relationship(back_populates="comment")


# Assocation table that defines a "user" liking a "comment"
class CommentLike(Base):
    __tablename__ = "comment_likes"
    id: Mapped[int] = mapped_column(primary_key=True)

    liker_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    liker: Mapped["User"] = relationship(back_populates="comments_liked")

    comment_id: Mapped[int] = mapped_column(ForeignKey("thread_comments.id"))
    comment: Mapped["ThreadComment"] = relationship(back_populates="comment_likes")


# ============================================
# =============== RECIPES ====================
# ============================================
class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[int] = mapped_column(primary_key=True)

    nutritionist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nutritionists.id"))
    nutritionist: Mapped["Nutritionist"] = relationship(back_populates="recipes_created")

    name: Mapped[str]
    description: Mapped[str]
    est_calories: Mapped[str]
    pregnancy_benefit: Mapped[str]

    img_key: Mapped[str | None]
    serving_count: Mapped[int]
    instructions_markdown: Mapped[str]

    recipe_category_associations: Mapped[list["RecipeToCategoryAssociation"]] = relationship(back_populates="recipe")
    saved_recipes: Mapped[list["SavedRecipe"]] = relationship(back_populates="recipe")


class RecipeCategory(Base):
    __tablename__ = "recipe_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(unique=True)

    recipe_category_associations: Mapped[list["RecipeToCategoryAssociation"]] = relationship(back_populates="category")


class RecipeToCategoryAssociation(Base):
    __tablename__ = "recipe_to_category_associations"
    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), primary_key=True)
    recipe: Mapped["Recipe"] = relationship(back_populates="recipe_category_associations")

    category_id: Mapped[int] = mapped_column(ForeignKey("recipe_categories.id"), primary_key=True)
    category: Mapped["RecipeCategory"] = relationship(back_populates="recipe_category_associations")


class SavedRecipe(Base):
    __tablename__ = "saved_recipes"

    id: Mapped[int] = mapped_column(primary_key=True)

    saver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    saver: Mapped["User"] = relationship(back_populates="saved_recipes")

    recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"))
    recipe: Mapped["Recipe"] = relationship(back_populates="saved_recipes")


# class Ingredient(Base):
#     __tablename__ = "ingredients"
#     id: Mapped[int] = mapped_column(primary_key=True)
#     name: Mapped[str]
#     protein_per_100g: Mapped[float | None]
#     carbs_per_100g: Mapped[float | None]
#     fats_per_100g: Mapped[float | None]
#     recipe_ingredients: Mapped[list["RecipeIngredient"]] = relationship(back_populates="ingredient")


# # The actual association table linking "recipe" and "ingredient"
# class RecipeIngredient(Base):
#     __tablename__ = "recipe_ingredients"

#     recipe_id: Mapped[int] = mapped_column(ForeignKey("recipes.id"), primary_key=True)
#     recipe: Mapped["Recipe"] = relationship(back_populates="recipe_ingredients")

#     ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.id"), primary_key=True)
#     ingredient: Mapped["Ingredient"] = relationship(back_populates="recipe_ingredients")

#     amount: Mapped[int]
#     unit_of_measurement: Mapped[str]


# ===========================================
# ============= KICK TRACKER ================
# ===========================================
class KickTrackerSession(Base):
    __tablename__ = "kick_tracker_sessions"
    id: Mapped[int] = mapped_column(primary_key=True)

    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"))
    mother: Mapped["PregnantWoman"] = relationship(back_populates="kick_tracker_sessions")

    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    kicks: Mapped[list["KickTrackerDataPoint"]] = relationship(back_populates="session")


class KickTrackerDataPoint(Base):
    __tablename__ = "kick_tracker_data_points"
    id: Mapped[int] = mapped_column(primary_key=True)
    kick_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    session_id: Mapped[int] = mapped_column(ForeignKey("kick_tracker_sessions.id"))
    session: Mapped["KickTrackerSession"] = relationship(back_populates="kicks")


# ===========================================
# ============ MISCELLANEOUS ================
# ===========================================
class UserAppFeedback(Base):
    __tablename__ = "user_app_feedback"
    id: Mapped[int] = mapped_column(primary_key=True)

    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    author: Mapped["User"] = relationship(back_populates="feedback_given")

    rating: Mapped[int]
    content: Mapped[str]


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(primary_key=True)

    recipient_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    recipient: Mapped["User"] = relationship(back_populates="notifications")

    content: Mapped[str]
    sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    # Intention - at the time of writing - is for the application layer to mark
    # a notification as "seen" once you click it
    #
    # I'll just assume that all the "seen" ones can be soft-deleted
    # Perhaps an occasional job can be run on the server to hard-delete those marked as seen
    is_seen: Mapped[bool] = mapped_column(server_default=text("FALSE"), index=True)

    # ----- Type + Data -----
    # For use at the application layer. Perhaps the type can dictate where you are led to when the app is clicked
    # type = "article", data = "45" (i.e. New suggested article, click to go to article ID=45)
    # type = "message_reply", data = "<SOME_JSON_DATA>" (i.e. JSON object containing link to message)
    type: Mapped["NotificationType"] = mapped_column(SQLAlchemyEnum(NotificationType))
    data: Mapped[str]


class DoctorAccountCreationRequest(Base):
    __tablename__ = "doctor_account_creation_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(64))
    middle_name: Mapped[str | None] = mapped_column(String(64))  # Middle name optional
    last_name: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password: Mapped[str] = mapped_column()
    qualification_img_key: Mapped[str]
    account_status: Mapped["AccountCreationRequestStatus"] = mapped_column(
        SQLAlchemyEnum(AccountCreationRequestStatus), server_default=text("'PENDING'")
    )
    reject_reason: Mapped[str | None]
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NutritionistAccountCreationRequest(Base):
    __tablename__ = "nutritionist_account_creation_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(64))
    middle_name: Mapped[str | None] = mapped_column(String(64))  # Middle name optional
    last_name: Mapped[str] = mapped_column(String(64))
    email: Mapped[str] = mapped_column(String(255), unique=True)
    password: Mapped[str] = mapped_column()
    qualification_img_key: Mapped[str]
    account_status: Mapped["AccountCreationRequestStatus"] = mapped_column(
        SQLAlchemyEnum(AccountCreationRequestStatus), server_default=text("'PENDING'")
    )
    reject_reason: Mapped[str | None]
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MCRNumber(Base):
    __tablename__ = "mcr_numbers"
    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String(7), unique=True)
    doctor: Mapped[VolunteerDoctor | None] = relationship(back_populates="mcr_no")


class ExpoPushToken(Base):
    __tablename__ = "expo_push_tokens"
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    token: Mapped[str]

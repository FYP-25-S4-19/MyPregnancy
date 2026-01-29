from __future__ import annotations

import uuid
from datetime import date, datetime
from enum import Enum

from fastapi_users_db_sqlalchemy import SQLAlchemyBaseUserTableUUID
from sqlalchemy import JSON, CheckConstraint, Date, DateTime, ForeignKey, Integer, String, Text, func, text
from sqlalchemy import Enum as SQLAlchemyEnum
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class AppointmentStatus(Enum):
    PENDING_ACCEPT_REJECT = "PENDING_ACCEPT_REJECT"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    # COMPLETED = "COMPLETED"


class AccountCreationRequestStatus(Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class UserRole(Enum):
    ADMIN = "ADMIN"
    VOLUNTEER_DOCTOR = "VOLUNTEER_DOCTOR"
    PREGNANT_WOMAN = "PREGNANT_WOMAN"
    NUTRITIONIST = "NUTRITIONIST"
    MERCHANT = "MERCHANT"


class BinaryMetricCategory(Enum):
    MOOD = "MOOD"
    SYMPTOMS = "SYMPTOMS"
    APPETITE = "APPETITE"
    DIGESTION = "DIGESTION"
    SWELLING = "SWELLING"
    PHYSICAL_ACTIVITY = "PHYSICAL_ACTIVITY"
    OTHERS = "OTHERS"


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
    articles_written: Mapped[list["EduArticle"]] = relationship(back_populates="author")
    saved_edu_articles: Mapped[list["SavedEduArticle"]] = relationship(back_populates="saver")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="recipient")
    saved_recipes: Mapped[list["SavedRecipe"]] = relationship(back_populates="saver")
    expo_push_tokens: Mapped[list["ExpoPushToken"]] = relationship(back_populates="user")


class Admin(User):
    __tablename__ = "admins"
    __mapper_args__ = {"polymorphic_identity": "admin"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore


class DoctorSpecialisation(Base):
    __tablename__ = "doctor_specialisations"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    specialisation: Mapped[str] = mapped_column(unique=True)

    # Relationship back to doctors
    doctors: Mapped[list["VolunteerDoctor"]] = relationship(back_populates="specialisation")


class VolunteerDoctor(User):
    __tablename__ = "volunteer_doctors"
    __mapper_args__ = {"polymorphic_identity": "volunteer_doctor"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore

    mcr_no_id: Mapped[int] = mapped_column(ForeignKey("mcr_numbers.id"))
    mcr_no: Mapped["MCRNumber"] = relationship(back_populates="doctor")

    specialisation_id: Mapped[int] = mapped_column(ForeignKey("doctor_specialisations.id"))
    specialisation: Mapped["DoctorSpecialisation"] = relationship(back_populates="doctors")

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
    date_of_birth: Mapped[date | None] = mapped_column(
        Date,
    )

    pregnancy_stage: Mapped[str | None] = mapped_column(String(20), nullable=True)
    pregnancy_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    expected_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    baby_date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)

    blood_type: Mapped[str | None] = mapped_column(String(5), nullable=True)
    allergies: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    diet_preferences: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    medical_conditions: Mapped[str | None] = mapped_column(Text, nullable=True)

    saved_volunteer_doctors: Mapped[list["SavedVolunteerDoctor"]] = relationship(back_populates="mother")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="mother")
    journal_entries: Mapped[list["JournalEntry"]] = relationship(back_populates="author")
    kick_tracker_sessions: Mapped[list["KickTrackerSession"]] = relationship(back_populates="mother")
    doctor_ratings: Mapped[list["DoctorRating"]] = relationship(back_populates="rater")
    liked_products: Mapped[list["MotherLikeProduct"]] = relationship(back_populates="mother")
    menstrual_periods: Mapped[list["MenstrualPeriod"]] = relationship(back_populates="mother")
    shopping_cart: Mapped["ShoppingCart"] = relationship(back_populates="mother")


class Nutritionist(User):
    __tablename__ = "nutritionists"
    __mapper_args__ = {"polymorphic_identity": "nutritionist"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore

    qualification_img_key: Mapped[str | None]
    recipes_created: Mapped[list["Recipe"]] = relationship(back_populates="nutritionist")
    recipe_drafts: Mapped[list["RecipeDraft"]] = relationship(back_populates="nutritionist")


class Merchant(User):
    __tablename__ = "merchants"
    __mapper_args__ = {"polymorphic_identity": "merchant"}
    id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)  # type: ignore
    products: Mapped[list["Product"]] = relationship(back_populates="merchant")
    product_drafts: Mapped[list["ProductDraft"]] = relationship(back_populates="merchant")


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
class EduArticleCategory(Base):
    __tablename__ = "edu_article_categories"
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    label: Mapped[str] = mapped_column(unique=True)

    # Relationship back to articles
    articles: Mapped[list["EduArticle"]] = relationship(back_populates="category")


class EduArticle(Base):
    __tablename__ = "edu_articles"
    id: Mapped[int] = mapped_column(primary_key=True)

    # >Nullable
    # Just in case we pull external articles, and they DON'T link
    # to one of the Doctors within our database
    author_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    author: Mapped[User] = relationship(back_populates="articles_written")

    # Each article has exactly 1 category (for now)
    category_id: Mapped[int] = mapped_column(ForeignKey("edu_article_categories.id"))
    category: Mapped["EduArticleCategory"] = relationship(back_populates="articles")

    # Trimester (1-3) - which trimester of pregnancy this article is relevant for
    trimester: Mapped[int] = mapped_column(CheckConstraint("trimester >= 1 AND trimester <= 3"))

    # img_key: Mapped[str | None] = mapped_column(String(255)) # Guess we aren't having images anymore
    title: Mapped[str] = mapped_column(String(255), unique=True)
    content_markdown: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    # Keep track of which users "saved" you
    saved_edu_articles: Mapped[list["SavedEduArticle"]] = relationship(back_populates="article")


class SavedEduArticle(Base):
    __tablename__ = "saved_edu_articles"
    saver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    saver: Mapped["User"] = relationship(back_populates="saved_edu_articles")

    article_id: Mapped[int] = mapped_column(ForeignKey("edu_articles.id", ondelete="CASCADE"), primary_key=True)
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

    chat_id: Mapped[uuid.UUID | None] = mapped_column(PgUUID(as_uuid=True), nullable=True)


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


class MenstrualPeriod(Base):
    __tablename__ = "menstrual_periods"
    id: Mapped[int] = mapped_column(primary_key=True)

    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"))
    mother: Mapped["PregnantWoman"] = relationship(back_populates="menstrual_periods")

    start_date: Mapped[date] = mapped_column(index=True)
    end_date: Mapped[date | None]


# ===========================================================
# ==================== COMMUNITY FORUM ======================
# ===========================================================
class ThreadCategory(Base):
    __tablename__ = "thread_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(64), unique=True)
    threads: Mapped[list["CommunityThread"]] = relationship(back_populates="category")


# A 'thread' is what you would usually call a 'forum post'
#
# I hesitated to call it 'post', just because of possible weird names that would
# potentially arise when having to use this in conjunction with the HTTP "POST" method
class CommunityThread(Base):
    __tablename__ = "community_threads"
    id: Mapped[int] = mapped_column(primary_key=True)

    creator_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    creator: Mapped["User"] = relationship(back_populates="threads_created")

    category_id: Mapped[int | None] = mapped_column(ForeignKey("thread_categories.id"), nullable=True)
    category: Mapped[ThreadCategory] = relationship(back_populates="threads")

    title: Mapped[str] = mapped_column(String(255))
    content: Mapped[str] = mapped_column(Text)
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    comments: Mapped[list["ThreadComment"]] = relationship(back_populates="thread")
    community_thread_likes: Mapped[list["CommunityThreadLike"]] = relationship(back_populates="thread")

    is_deleted: Mapped[bool] = mapped_column(server_default=text("FALSE"))


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
    is_deleted: Mapped[bool] = mapped_column(server_default=text("FALSE"))


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

    # Trimester (1-3) - which trimester of pregnancy this recipe is relevant for
    trimester: Mapped[int] = mapped_column(CheckConstraint("trimester >= 1 AND trimester <= 3"))

    img_key: Mapped[str | None]
    serving_count: Mapped[int]
    ingredients: Mapped[str]
    instructions_markdown: Mapped[str]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    recipe_category_associations: Mapped[list["RecipeToCategoryAssociation"]] = relationship(back_populates="recipe")
    saved_recipes: Mapped[list["SavedRecipe"]] = relationship(back_populates="recipe")


class RecipeDraft(Base):
    __tablename__ = "recipe_drafts"
    id: Mapped[int] = mapped_column(primary_key=True)

    # Trimester (1-3) - nullable since draft may not be complete
    trimester: Mapped[int | None] = mapped_column(
        CheckConstraint("trimester IS NULL OR (trimester >= 1 AND trimester <= 3)")
    )

    nutritionist_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("nutritionists.id"))
    nutritionist: Mapped["Nutritionist"] = relationship(back_populates="recipe_drafts")

    # All content fields are nullable since drafts can be incomplete
    name: Mapped[str | None]
    description: Mapped[str | None]
    est_calories: Mapped[str | None]
    pregnancy_benefit: Mapped[str | None]

    img_key: Mapped[str | None]
    serving_count: Mapped[int | None]
    ingredients: Mapped[str | None]
    instructions_markdown: Mapped[str | None]

    # Category ID stored directly for simplicity (no associations for drafts)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("recipe_categories.id"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


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


# ==============================================
# ============= PRODUCT/MERCHANT ===============
# ==============================================
class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), unique=True)

    merchant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("merchants.id"))
    merchant: Mapped[Merchant] = relationship(back_populates="products")

    category_id: Mapped[int] = mapped_column(ForeignKey("product_categories.id"))
    category: Mapped["ProductCategory"] = relationship(back_populates="products")

    price_cents: Mapped[int] = mapped_column(CheckConstraint("price_cents >= 0"))
    description: Mapped[str] = mapped_column(Text)
    img_key: Mapped[str | None]
    listed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    liked_by_mothers: Mapped[list["MotherLikeProduct"]] = relationship(back_populates="product")
    cart_items: Mapped[list["ShoppingCartItem"]] = relationship(back_populates="product")


class ProductCategory(Base):
    __tablename__ = "product_categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class ProductDraft(Base):
    __tablename__ = "product_drafts"
    id: Mapped[int] = mapped_column(primary_key=True)

    merchant_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("merchants.id"))
    merchant: Mapped["Merchant"] = relationship(back_populates="product_drafts")

    # All content fields are nullable since drafts can be incomplete
    name: Mapped[str | None] = mapped_column(String(255))
    category_id: Mapped[int | None] = mapped_column(ForeignKey("product_categories.id"))
    price_cents: Mapped[int | None] = mapped_column(CheckConstraint("price_cents >= 0 OR price_cents IS NULL"))
    description: Mapped[str | None] = mapped_column(Text)
    img_key: Mapped[str | None]

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class MotherLikeProduct(Base):
    __tablename__ = "mother_like_products"
    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"), primary_key=True)
    mother: Mapped["PregnantWoman"] = relationship(back_populates="liked_products")

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), primary_key=True)
    product: Mapped["Product"] = relationship(back_populates="liked_by_mothers")


# Each user has exactly 1 shopping cart....(cont'd below)
class ShoppingCart(Base):
    __tablename__ = "shopping_carts"
    id: Mapped[int] = mapped_column(primary_key=True)

    mother_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("pregnant_women.id"))
    mother: Mapped["PregnantWoman"] = relationship(back_populates="shopping_cart")

    items: Mapped[list["ShoppingCartItem"]] = relationship(back_populates="cart", cascade="all, delete-orphan")


# ....But each shopping cart can have multiple items
class ShoppingCartItem(Base):
    __tablename__ = "shopping_cart_items"
    id: Mapped[int] = mapped_column(primary_key=True)

    cart_id: Mapped[int] = mapped_column(ForeignKey("shopping_carts.id"))
    cart: Mapped["ShoppingCart"] = relationship(back_populates="items")

    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    product: Mapped[Product] = relationship(back_populates="cart_items")

    quantity: Mapped[int] = mapped_column(CheckConstraint("quantity > 0"))


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

    positive_score: Mapped[float]
    neutral_score: Mapped[float]
    negative_score: Mapped[float]
    compound_score: Mapped[float]


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
    # For use at the application layer. Perhaps the type can dictate the shape of the 'data' field
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
    mcr_no: Mapped[str]
    specialisation: Mapped[str]
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


# Since a user can have many devices, each with their own "push token" - what we will do is....
# Make the "token" the PK, and make the users have a one-to-many relationship with the expo tokens
#
# i.e Many tokens are tied to the same user
class ExpoPushToken(Base):
    __tablename__ = "expo_push_tokens"
    token: Mapped[str] = mapped_column(primary_key=True)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    user: Mapped["User"] = relationship(back_populates="expo_push_tokens")


# ===========================================
# ============ Website Content ===============
# ===========================================
class Page(Base):
    __tablename__ = "pages"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    sections: Mapped[dict] = mapped_column(JSONB, nullable=False)
    background_image: Mapped[str | None] = mapped_column(Text, nullable=True)  # Base64 image
    html: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

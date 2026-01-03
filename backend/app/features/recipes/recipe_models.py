from datetime import datetime

from app.core.custom_base_model import CustomBaseModel


class RecipeCategoryResponse(CustomBaseModel):
    id: int
    label: str


class RecipePreviewResponse(CustomBaseModel):
    id: int
    name: str
    img_url: str
    description: str
    category: str | None
    is_saved: bool


class RecipePreviewsPaginatedResponse(CustomBaseModel):
    recipes: list[RecipePreviewResponse]
    next_cursor: int | None
    has_more: bool


class RecipeDetailedResponse(CustomBaseModel):
    id: int
    name: str
    description: str
    est_calories: str
    pregnancy_benefit: str
    img_url: str
    serving_count: int
    ingredients: str
    instructions: str
    category: str | None
    is_saved: bool


class RecipeDraftResponse(CustomBaseModel):
    id: int
    name: str | None
    description: str | None
    est_calories: str | None
    pregnancy_benefit: str | None
    img_url: str | None
    serving_count: int | None
    ingredients: str | None
    instructions_markdown: str | None
    category_id: int | None
    category_label: str | None
    created_at: datetime
    updated_at: datetime


class RecipeDraftCreateRequest(CustomBaseModel):
    name: str | None = None
    description: str | None = None
    est_calories: str | None = None
    pregnancy_benefit: str | None = None
    serving_count: int | None = None
    ingredients: str | None = None
    instructions_markdown: str | None = None
    category_id: int | None = None


class RecipeDraftUpdateRequest(CustomBaseModel):
    name: str | None = None
    description: str | None = None
    est_calories: str | None = None
    pregnancy_benefit: str | None = None
    serving_count: int | None = None
    ingredients: str | None = None
    instructions_markdown: str | None = None
    category_id: int | None = None

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
    trimester: int
    is_saved: bool


class RecipePreviewsPaginatedResponse(CustomBaseModel):
    recipes: list[RecipePreviewResponse]
    next_cursor: str | None
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
    trimester: int
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
    trimester: int | None
    created_at: datetime
    updated_at: datetime


class RecipeDraftCreateRequest(CustomBaseModel):
    name: str | None = None
    description: str | None = None
    ingredients: str | None = None
    instructions_markdown: str | None = None
    est_calories: str | None = None
    pregnancy_benefit: str | None = None
    serving_count: int | None = None
    trimester: int | None = None
    category_id: int | None = None


# def RecipeDraftCreationForm(
#     name: str | None = Form(...),
#     description: str | None = Form(...),
#     ingredients: str | None = Form(...),
#     instructions_markdown: str | None = Form(...),
#     est_calories: str | None = Form(...),
#     pregnancy_benefit: str | None = Form(...),
#     serving_count: int | None = Form(...),
#     trimester: int | None = Form(...),
#     category: str | None = Form(...),
# ) -> RecipeDraftCreateRequest:
#     return RecipeDraftCreateRequest(
#         name=name,
#         description=description,
#         ingredients=ingredients,
#         instructions_markdown=instructions_markdown,
#         est_calories=est_calories,
#         pregnancy_benefit=pregnancy_benefit,
#         serving_count=serving_count,
#         trimester=trimester,
#         category=category,
#     )


class RecipeDraftUpdateRequest(CustomBaseModel):
    name: str | None = None
    description: str | None = None
    est_calories: str | None = None
    pregnancy_benefit: str | None = None
    serving_count: int | None = None
    ingredients: str | None = None
    instructions_markdown: str | None = None
    category_id: int | None = None
    trimester: int | None = None


class CreateRecipeCategoryRequest(CustomBaseModel):
    label: str


class UpdateRecipeCategoryRequest(CustomBaseModel):
    label: str

from app.core.custom_base_model import CustomBaseModel


class RecipePreviewResponse(CustomBaseModel):
    id: int
    name: str
    img_url: str
    description: str
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
    is_saved: bool

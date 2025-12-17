from app.core.custom_base_model import CustomBaseModel

class RecipeCreateRequest(CustomBaseModel):
    name: str
    ingredients: list[str]
    instructions: str


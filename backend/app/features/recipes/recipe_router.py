from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import current_active_user, optional_current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Nutritionist, User
from app.features.recipes.recipe_models import (
    RecipeCategoryResponse,
    RecipeDetailedResponse,
    RecipePreviewsPaginatedResponse,
)
from app.features.recipes.recipe_service import RecipeService

recipe_router = APIRouter(prefix="/recipes", tags=["Recipes"])


def get_recipe_service(db: AsyncSession = Depends(get_db)) -> RecipeService:
    return RecipeService(db)


@recipe_router.get("/categories", response_model=list[RecipeCategoryResponse])
async def get_recipe_categories(
    service: RecipeService = Depends(get_recipe_service),
) -> list[RecipeCategoryResponse]:
    return await service.get_recipe_categories()


@recipe_router.get("/previews", response_model=RecipePreviewsPaginatedResponse)
async def get_recipe_previews(
    limit: int = 6,
    cursor: int | None = None,
    user: User | None = Depends(optional_current_active_user),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipePreviewsPaginatedResponse:
    return await service.get_recipe_previews(limit, user, cursor)


@recipe_router.get("/{recipe_id}", response_model=RecipeDetailedResponse)
async def get_recipe_by_id(
    recipe_id: int,
    user: User | None = Depends(optional_current_active_user),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeDetailedResponse:
    return await service.get_recipe_by_id(recipe_id, user)


@recipe_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_recipe(
    name: str = Form(...),
    instructions: str = Form(...),
    ingredients: str = Form(...),
    description: str = Form(...),
    est_calories: str = Form(...),
    pregnancy_benefit: str = Form(...),
    serving_count: int = Form(...),
    image_file: UploadFile = File(),
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    db: AsyncSession = Depends(get_db),
    service: RecipeService = Depends(get_recipe_service),
):
    try:
        await service.create_recipe(
            name,
            instructions,
            ingredients,
            description,
            int(est_calories),
            pregnancy_benefit,
            int(serving_count),
            image_file,
            nutritionist,
        )
        await db.commit()
    except:
        await db.rollback()
        raise


@recipe_router.post("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe(
    recipe_id: int,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_recipe(recipe_id, nutritionist.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@recipe_router.post("/{recipe_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def save_recipe(
    recipe_id: int,
    user: User = Depends(current_active_user),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.save_recipe(recipe_id, user.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@recipe_router.delete("/{recipe_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_recipe(
    recipe_id: int,
    user: User = Depends(current_active_user),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.unsave_recipe(recipe_id, user.id)
        await db.commit()
    except:
        await db.rollback()
        raise

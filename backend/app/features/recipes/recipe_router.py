from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import current_active_user, optional_current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Admin, Nutritionist, Recipe, User
from app.features.recipes.recipe_models import (
    CreateRecipeCategoryRequest,
    RecipeCategoryResponse,
    RecipeDetailedResponse,
    RecipeDraftCreateRequest,
    RecipeDraftResponse,
    RecipeDraftUpdateRequest,
    RecipePreviewsPaginatedResponse,
    UpdateRecipeCategoryRequest,
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


@recipe_router.get("/all", response_model=list[str])
async def get_all_recipes(db: AsyncSession = Depends(get_db)) -> list[str]:
    stmt = select(Recipe)
    results = await db.execute(stmt)
    recipes = results.scalars().all()
    return [recipe.name for recipe in recipes]


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
    trimester: int = Form(...),
    category_id: int = Form(...),
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
            est_calories,
            pregnancy_benefit,
            int(serving_count),
            int(trimester),
            int(category_id),
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


# =================================================================
# ====================== DRAFT ENDPOINTS ==========================
# =================================================================


@recipe_router.post("/drafts", status_code=status.HTTP_201_CREATED, response_model=RecipeDraftResponse)
async def create_recipe_draft(
    draft_data: RecipeDraftCreateRequest,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
) -> RecipeDraftResponse:
    try:
        draft = await service.create_recipe_draft(nutritionist, draft_data)
        await db.commit()
        return draft
    except:
        await db.rollback()
        raise


@recipe_router.get("/drafts/", response_model=list[RecipeDraftResponse])
async def list_recipe_drafts(
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
) -> list[RecipeDraftResponse]:
    return await service.list_recipe_drafts(nutritionist.id)


@recipe_router.get("/drafts/{draft_id}", response_model=RecipeDraftResponse)
async def get_recipe_draft(
    draft_id: int,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeDraftResponse:
    return await service.get_recipe_draft(draft_id, nutritionist.id)


@recipe_router.patch("/drafts/{draft_id}", response_model=RecipeDraftResponse)
async def update_recipe_draft(
    draft_id: int,
    draft_data: RecipeDraftUpdateRequest,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
) -> RecipeDraftResponse:
    try:
        draft = await service.update_recipe_draft(draft_id, nutritionist.id, draft_data)
        await db.commit()
        return draft
    except:
        await db.rollback()
        raise


@recipe_router.post("/drafts/{draft_id}/image", status_code=status.HTTP_204_NO_CONTENT)
async def upload_recipe_draft_image(
    draft_id: int,
    img_file: UploadFile = File(...),
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.upload_recipe_draft_image(draft_id, nutritionist.id, img_file)
        await db.commit()
    except:
        await db.rollback()
        raise


@recipe_router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe_draft(
    draft_id: int,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_recipe_draft(draft_id, nutritionist.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@recipe_router.post("/drafts/{draft_id}/publish", status_code=status.HTTP_201_CREATED)
async def publish_recipe_draft(
    draft_id: int,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    service: RecipeService = Depends(get_recipe_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        recipe = await service.publish_recipe_draft(draft_id, nutritionist)
        await db.commit()
        return {"message": "Recipe published successfully", "recipe_id": recipe.id}
    except:
        await db.rollback()
        raise


# =================================================================
# ====================== CATEGORY ENDPOINTS =======================
# =================================================================


@recipe_router.post("/admin/categories", response_model=RecipeCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_recipe_category(
    request: CreateRecipeCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeCategoryResponse:
    try:
        result = await service.create_category(request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@recipe_router.patch("/admin/categories/{category_id}", response_model=RecipeCategoryResponse)
async def update_recipe_category(
    category_id: int,
    request: UpdateRecipeCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeCategoryResponse:
    try:
        result = await service.update_category(category_id, request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@recipe_router.delete("/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_recipe_category(
    category_id: int,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: RecipeService = Depends(get_recipe_service),
) -> None:
    try:
        await service.delete_category(category_id)
        await db.commit()
    except Exception:
        await db.rollback()
        raise

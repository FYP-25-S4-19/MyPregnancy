from fastapi import APIRouter, Depends, status, HTTPException, Form, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import require_role
from app.db.db_config import get_db
from app.db.db_schema import Recipe, Nutritionist
from app.features.recipes.recipe_models import RecipeCreateRequest
from app.shared.s3_storage_interface import S3StorageInterface

recipe_router = APIRouter(prefix="/recipes", tags=["Recipes"])


@recipe_router.get("/")
async def list_all_recipes(db: AsyncSession = Depends(get_db)):
    query_stmt = select(Recipe)
    all_recipes: list[Recipe] = (await db.execute(query_stmt)).scalars().all()
    return [recipe.name for recipe in all_recipes]


@recipe_router.get("/{recipe_id}")
async def get_recipe(recipe_id: int, db: AsyncSession = Depends(get_db)):
    query_stmt = select(Recipe).where(Recipe.id == recipe_id)
    recipe = (await db.execute(query_stmt)).scalars().first()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )

    return recipe


@recipe_router.post("/", status_code=status.HTTP_201_CREATED)
async def create_recipe(
    name: str = Form(...),
    instructions_markdown: str = Form(...),
    description: str = Form(...),
    est_calories: str = Form(...),
    pregnancy_benefit: str = Form(...),
    serving_count: str = Form(...),
    image_file: UploadFile = File(),
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    db: AsyncSession = Depends(get_db)
):
    if name.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipe name cannot be empty"
        )

    if instructions_markdown.strip() == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Instructions cannot be empty"
        )


    recipe_img_key = S3StorageInterface.put_staging_recipe_img(image_file)
    if recipe_img_key is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload qualification image. Please try again.",
        )

    new_recipe = Recipe(
        nutritionist_id=nutritionist.id,
        name=name,
        instructions_markdown=instructions_markdown,
        description=description,
        est_calories=est_calories,
        pregnancy_benefit=pregnancy_benefit,
        serving_count=serving_count,

        image_file=recipe_img_key,
    )

    db.add(new_recipe)
    await db.commit()
    await db.refresh(new_recipe)

    return new_recipe


@recipe_router.post("/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    nutritionist: Nutritionist = Depends(require_role(Nutritionist)),
    db: AsyncSession = Depends(get_db)
) -> list[str]:

    query_stmt = select(Recipe).where(Recipe.id == recipe_id)
    recipe = (await db.execute(query_stmt)).scalars().first()

    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recipe not found"
        )

    if recipe.nutritionist_id != nutritionist.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to delete this recipe"
        )

    await db.delete(recipe)
    await db.commit()

    # same output format as list_all_recipes
    query_stmt = select(Recipe)
    all_recipes: list[Recipe] = (await db.execute(query_stmt)).scalars().all()
    return [recipe.name for recipe in all_recipes]

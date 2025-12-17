from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import (
    Nutritionist,
    Recipe,
    RecipeCategory,
    RecipeToCategoryAssociation,
    User,
)
from app.features.recipes.recipe_models import (
    RecipeCategoryResponse,
    RecipeDetailedResponse,
    RecipePreviewResponse,
    RecipePreviewsPaginatedResponse,
)
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import get_s3_bucket_prefix


class RecipeService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_recipe_categories(self) -> list[RecipeCategoryResponse]:
        result = await self.db.execute(select(RecipeCategory))
        categories = result.scalars().all()
        return [RecipeCategoryResponse(id=category.id, label=category.label) for category in categories]

    async def get_recipe_previews(
        self, limit: int, user: User | None, cursor: int | None = None
    ) -> RecipePreviewsPaginatedResponse:
        query_stmt = (
            select(Recipe)
            .options(
                selectinload(Recipe.saved_recipes),
                selectinload(Recipe.recipe_category_associations).selectinload(RecipeToCategoryAssociation.category),
            )
            .order_by(Recipe.id)
        )
        if cursor is not None:
            query_stmt = query_stmt.where(Recipe.id > cursor)

        query_stmt = query_stmt.limit(limit + 1)
        recipes = (await self.db.execute(query_stmt)).scalars().all()

        # Remove the extra record if it exists
        has_more = len(recipes) > limit
        if has_more:
            recipes = recipes[:limit]

        # Determine the next cursor (the id of the last recipe)
        next_cursor = recipes[-1].id if recipes and has_more else None

        recipe_previews = [
            RecipePreviewResponse(
                id=recipe.id,
                name=recipe.name,
                category=recipe.recipe_category_associations[0].category.label,
                img_url=(get_s3_bucket_prefix() + recipe.img_key) if recipe.img_key else "",
                description=recipe.description,
                is_saved=(any(saved.saver_id == user.id for saved in recipe.saved_recipes) if user else False),
            )
            for recipe in recipes
        ]

        return RecipePreviewsPaginatedResponse(
            recipes=recipe_previews,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    async def get_recipe_by_id(self, recipe_id: int, user: User | None) -> RecipeDetailedResponse:
        query_stmt = (
            select(Recipe)
            .options(
                selectinload(Recipe.saved_recipes),
                selectinload(Recipe.recipe_category_associations).selectinload(RecipeToCategoryAssociation.category),
            )
            .where(Recipe.id == recipe_id)
        )
        recipe = (await self.db.execute(query_stmt)).scalars().first()
        if not recipe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

        img_url = get_s3_bucket_prefix() + recipe.img_key if recipe.img_key else ""
        is_saved = any(saved.saver_id == user.id for saved in recipe.saved_recipes) if user else False

        return RecipeDetailedResponse(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description,
            est_calories=recipe.est_calories,
            pregnancy_benefit=recipe.pregnancy_benefit,
            img_url=img_url,
            serving_count=recipe.serving_count,
            ingredients=recipe.ingredients,
            instructions=recipe.instructions_markdown,
            category=recipe.recipe_category_associations[0].category.label,
            is_saved=is_saved,
        )

    async def create_recipe(
        self,
        name: str,
        instructions: str,
        ingredients: str,
        description: str,
        est_calories: int,
        pregnancy_benefit: str,
        serving_count: int,
        image_file: UploadFile,
        nutritionist: Nutritionist,
    ) -> None:
        if name.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe name cannot be empty")

        if ingredients.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ingredients cannot be empty")

        if instructions.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instructions cannot be empty")

        new_recipe = Recipe(
            nutritionist_id=nutritionist.id,
            name=name,
            instructions_markdown=instructions,
            description=description,
            est_calories=est_calories,
            pregnancy_benefit=pregnancy_benefit,
            serving_count=serving_count,
        )
        self.db.add(new_recipe)
        await self.db.flush()

        recipe_img_key = S3StorageInterface.put_recipe_img(new_recipe.id, image_file)
        if recipe_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload qualification image. Please try again.",
            )
        new_recipe.img_key = recipe_img_key

    async def delete_recipe(self, recipe_id: int, nutritionist_id: UUID):
        query_stmt = select(Recipe).where(Recipe.id == recipe_id)
        recipe = (await self.db.execute(query_stmt)).scalars().first()

        if not recipe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

        if recipe.nutritionist_id != nutritionist_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You are not allowed to delete this recipe"
            )

        await self.db.delete(recipe)

from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.settings import settings
from app.db.db_schema import (
    Nutritionist,
    Recipe,
    RecipeCategory,
    RecipeDraft,
    RecipeToCategoryAssociation,
    SavedRecipe,
    User,
)
from app.features.recipes.recipe_models import (
    RecipeCategoryResponse,
    RecipeDetailedResponse,
    RecipeDraftCreateRequest,
    RecipeDraftResponse,
    RecipeDraftUpdateRequest,
    RecipePreviewResponse,
    RecipePreviewsPaginatedResponse,
)
from app.shared.s3_storage_interface import S3StorageInterface


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
                img_url=(
                    S3StorageInterface.get_presigned_url(recipe.img_key, settings.PRESIGNED_URL_EXP_SECONDS) or ""
                    if recipe.img_key
                    else ""
                ),
                description=recipe.description,
                trimester=recipe.trimester,
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

        presigned_url: str | None = (
            S3StorageInterface.get_presigned_url(recipe.img_key, settings.PRESIGNED_URL_EXP_SECONDS)
            if recipe.img_key
            else ""
        )
        is_saved = any(saved.saver_id == user.id for saved in recipe.saved_recipes) if user else False

        return RecipeDetailedResponse(
            id=recipe.id,
            name=recipe.name,
            description=recipe.description,
            est_calories=recipe.est_calories,
            pregnancy_benefit=recipe.pregnancy_benefit,
            img_url=presigned_url if presigned_url else "",
            serving_count=recipe.serving_count,
            ingredients=recipe.ingredients,
            instructions=recipe.instructions_markdown,
            category=recipe.recipe_category_associations[0].category.label,
            trimester=recipe.trimester,
            is_saved=is_saved,
        )

    async def create_recipe(
        self,
        name: str,
        instructions: str,
        ingredients: str,
        description: str,
        est_calories: str,
        pregnancy_benefit: str,
        serving_count: int,
        trimester: int,
        category_id: int,
        image_file: UploadFile,
        nutritionist: Nutritionist,
    ) -> None:
        if name.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe name cannot be empty")

        if ingredients.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ingredients cannot be empty")

        if instructions.strip() == "":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instructions cannot be empty")

        if trimester < 1 or trimester > 3:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trimester must be 1, 2, or 3")

        new_recipe = Recipe(
            nutritionist=nutritionist,
            name=name,
            description=description,
            est_calories=est_calories,
            pregnancy_benefit=pregnancy_benefit,
            img_key="",
            serving_count=serving_count,
            ingredients=ingredients,
            instructions_markdown=instructions,
            trimester=trimester,
            category_id=category_id,
        )
        self.db.add(new_recipe)
        await self.db.flush()

        await image_file.seek(0)
        recipe_img_key = S3StorageInterface.put_recipe_img(new_recipe.id, image_file)
        if recipe_img_key is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload recipe image. Please try again.",
            )
        new_recipe.img_key = recipe_img_key

        # Associate the recipe with the selected category
        category_association = RecipeToCategoryAssociation(
            recipe_id=new_recipe.id,
            category_id=category_id,
        )
        self.db.add(category_association)

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

    async def save_recipe(self, recipe_id: int, user_id: UUID) -> None:
        recipe = (await self.db.execute(select(Recipe).where(Recipe.id == recipe_id))).scalars().first()
        if not recipe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not found")

        existing_save = (
            (
                await self.db.execute(
                    select(SavedRecipe).where(SavedRecipe.recipe_id == recipe_id, SavedRecipe.saver_id == user_id)
                )
            )
            .scalars()
            .first()
        )

        if existing_save:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe already saved")

        saved_recipe = SavedRecipe(recipe_id=recipe_id, saver_id=user_id)
        self.db.add(saved_recipe)

    async def unsave_recipe(self, recipe_id: int, user_id: UUID) -> None:
        saved_recipe = (
            (
                await self.db.execute(
                    select(SavedRecipe).where(SavedRecipe.recipe_id == recipe_id, SavedRecipe.saver_id == user_id)
                )
            )
            .scalars()
            .first()
        )

        if not saved_recipe:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe not saved")

        await self.db.delete(saved_recipe)

    # =================================================================
    # ====================== DRAFT METHODS ============================
    # =================================================================

    async def create_recipe_draft(
        self, nutritionist: Nutritionist, draft_data: RecipeDraftCreateRequest
    ) -> RecipeDraftResponse:
        # Validate category if provided
        print("About to validate category")
        if draft_data.category_id is not None:
            category_stmt = select(RecipeCategory).where(RecipeCategory.id == draft_data.category_id)
            existing_category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if not existing_category:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recipe category")

        print("Category validated, ID:", draft_data.category_id)
        new_draft = RecipeDraft(
            nutritionist_id=nutritionist.id,
            name=draft_data.name,
            description=draft_data.description,
            est_calories=draft_data.est_calories,
            pregnancy_benefit=draft_data.pregnancy_benefit,
            serving_count=draft_data.serving_count,
            ingredients=draft_data.ingredients,
            instructions_markdown=draft_data.instructions_markdown,
            category_id=draft_data.category_id,
            trimester=draft_data.trimester,
        )
        print("Recipe Draft:", new_draft)
        self.db.add(new_draft)
        await self.db.flush()

        return await self._build_draft_response(new_draft)

    async def get_recipe_draft(self, draft_id: int, nutritionist_id: UUID) -> RecipeDraftResponse:
        stmt = select(RecipeDraft).where(RecipeDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe draft not found")

        if draft.nutritionist_id != nutritionist_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this draft",
            )

        return await self._build_draft_response(draft)

    async def list_recipe_drafts(self, nutritionist_id: UUID) -> list[RecipeDraftResponse]:
        stmt = (
            select(RecipeDraft)
            .where(RecipeDraft.nutritionist_id == nutritionist_id)
            .order_by(RecipeDraft.updated_at.desc())
        )
        drafts = (await self.db.execute(stmt)).scalars().all()

        return [await self._build_draft_response(draft) for draft in drafts]

    async def update_recipe_draft(
        self, draft_id: int, nutritionist_id: UUID, draft_data: RecipeDraftUpdateRequest
    ) -> RecipeDraftResponse:
        stmt = select(RecipeDraft).where(RecipeDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe draft not found")

        if draft.nutritionist_id != nutritionist_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this draft",
            )

        # Validate category if being updated
        if draft_data.category_id is not None:
            category_stmt = select(RecipeCategory).where(RecipeCategory.id == draft_data.category_id)
            category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if not category:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recipe category")

        # Update fields (only if provided in request)
        if draft_data.name is not None:
            draft.name = draft_data.name
        if draft_data.description is not None:
            draft.description = draft_data.description
        if draft_data.est_calories is not None:
            draft.est_calories = draft_data.est_calories
        if draft_data.pregnancy_benefit is not None:
            draft.pregnancy_benefit = draft_data.pregnancy_benefit
        if draft_data.serving_count is not None:
            draft.serving_count = draft_data.serving_count
        if draft_data.ingredients is not None:
            draft.ingredients = draft_data.ingredients
        if draft_data.instructions_markdown is not None:
            draft.instructions_markdown = draft_data.instructions_markdown
        if draft_data.category_id is not None:
            draft.category_id = draft_data.category_id
        if draft_data.trimester is not None:
            draft.trimester = draft_data.trimester

        await self.db.flush()
        return await self._build_draft_response(draft)

    async def upload_recipe_draft_image(self, draft_id: int, nutritionist_id: UUID, img_file: UploadFile) -> None:
        stmt = select(RecipeDraft).where(RecipeDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe draft not found")

        if draft.nutritionist_id != nutritionist_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this draft",
            )

        # Upload to S3 using a special prefix for drafts
        img_key = S3StorageInterface.put_recipe_draft_img(draft.id, img_file)
        if not img_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload draft image",
            )
        draft.img_key = img_key

    async def delete_recipe_draft(self, draft_id: int, nutritionist_id: UUID) -> None:
        stmt = select(RecipeDraft).where(RecipeDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe draft not found")

        if draft.nutritionist_id != nutritionist_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this draft",
            )

        await self.db.delete(draft)

    async def publish_recipe_draft(self, draft_id: int, nutritionist: Nutritionist) -> Recipe:
        stmt = select(RecipeDraft).where(RecipeDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe draft not found")

        if draft.nutritionist_id != nutritionist.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this draft",
            )

        # Validate all required fields are present
        if not draft.name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe name is required")
        if not draft.description:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe description is required")
        if not draft.est_calories:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Estimated calories is required")
        if not draft.pregnancy_benefit:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Pregnancy benefit is required")
        if draft.serving_count is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Serving count is required")
        if not draft.ingredients:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ingredients are required")
        if not draft.instructions_markdown:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Instructions are required")
        if not draft.img_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe image is required")
        if draft.category_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recipe category is required")
        if draft.trimester is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Trimester is required")

        # Get the category
        category_stmt = select(RecipeCategory).where(RecipeCategory.id == draft.category_id)
        category = (await self.db.execute(category_stmt)).scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid recipe category")

        # Create the published recipe
        new_recipe = Recipe(
            nutritionist=nutritionist,
            name=draft.name,
            description=draft.description,
            est_calories=draft.est_calories,
            pregnancy_benefit=draft.pregnancy_benefit,
            serving_count=draft.serving_count,
            ingredients=draft.ingredients,
            instructions_markdown=draft.instructions_markdown,
            trimester=draft.trimester,
        )
        self.db.add(new_recipe)
        await self.db.flush()

        # Copy/promote the draft image to the recipe image location
        if draft.img_key:
            img_key = S3StorageInterface.promote_recipe_draft_img(new_recipe.id, draft.img_key)
            if img_key:
                new_recipe.img_key = img_key
            else:
                # Fallback: just use the draft img_key if promotion fails
                new_recipe.img_key = draft.img_key

        # Create the category association
        category_association = RecipeToCategoryAssociation(
            recipe_id=new_recipe.id,
            category_id=category.id,
        )
        self.db.add(category_association)

        # Delete the draft after successful publication
        await self.db.delete(draft)

        return new_recipe

    async def _build_draft_response(self, draft: RecipeDraft) -> RecipeDraftResponse:
        category_label = None
        if draft.category_id is not None:
            category_stmt = select(RecipeCategory).where(RecipeCategory.id == draft.category_id)
            category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if category:
                category_label = category.label

        presigned_url: str | None = (
            S3StorageInterface.get_presigned_url(draft.img_key, settings.PRESIGNED_URL_EXP_SECONDS)
            if draft.img_key
            else None
        )

        return RecipeDraftResponse(
            id=draft.id,
            name=draft.name,
            description=draft.description,
            est_calories=draft.est_calories,
            pregnancy_benefit=draft.pregnancy_benefit,
            img_url=presigned_url,
            serving_count=draft.serving_count,
            ingredients=draft.ingredients,
            instructions_markdown=draft.instructions_markdown,
            category_id=draft.category_id,
            category_label=category_label,
            trimester=draft.trimester,
            created_at=draft.created_at,
            updated_at=draft.updated_at,
        )

    async def create_category(self, label: str) -> RecipeCategoryResponse:
        # Check if category already exists
        query = select(RecipeCategory).where(RecipeCategory.label == label)
        result = await self.db.execute(query)
        existing = result.scalars().first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category already exists",
            )

        new_category = RecipeCategory(label=label)
        self.db.add(new_category)
        await self.db.flush()

        return RecipeCategoryResponse(id=new_category.id, label=new_category.label)

    async def update_category(self, category_id: int, label: str) -> RecipeCategoryResponse:
        query = select(RecipeCategory).where(RecipeCategory.id == category_id)
        result = await self.db.execute(query)
        category = result.scalars().first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        # Check if new label already exists (and it's not the same category being updated)
        query = select(RecipeCategory).where(RecipeCategory.label == label)
        result = await self.db.execute(query)
        existing = result.scalars().first()
        if existing and existing.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category label already exists",
            )

        category.label = label
        await self.db.flush()

        return RecipeCategoryResponse(id=category.id, label=category.label)

    async def delete_category(self, category_id: int) -> None:
        query = select(RecipeCategory).where(RecipeCategory.id == category_id)
        result = await self.db.execute(query)
        category = result.scalars().first()
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found",
            )

        # Check if any recipes have this category
        assoc_query = select(RecipeToCategoryAssociation).where(RecipeToCategoryAssociation.category_id == category_id)
        assoc_result = await self.db.execute(assoc_query)
        associations = assoc_result.scalars().all()
        if associations:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Cannot delete category. {len(associations)} recipe(s) have this category.",
            )

        await self.db.delete(category)

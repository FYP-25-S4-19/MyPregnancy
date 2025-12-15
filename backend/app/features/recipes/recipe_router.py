from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.db_config import get_db
from app.db.db_schema import Recipe

recipe_router = APIRouter(prefix="/recipes", tags=["Recipes"])


@recipe_router.get("/")
async def list_all_recipes(db: AsyncSession = Depends(get_db)):
    query_stmt = select(Recipe)
    all_recipes: list[Recipe] = (await db.execute(query_stmt)).scalars().all()
    return [recipe.name for recipe in all_recipes]


@recipe_router.get("/{recipe_id}")
async def list_all_recipes(recipe_id: int):
    return {"message": f"Fetching recipe with ID: {recipe_id}"}


@recipe_router.post("/")
async def create_recipe():
    pass


@recipe_router.post("/{recipe_id}")
async def delete_recipe(recipe_id: int):
    pass

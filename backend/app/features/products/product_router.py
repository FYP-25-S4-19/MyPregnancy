from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.users_manager import optional_current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Merchant, PregnantWoman, User
from app.features.products.product_models import (
    ProductCategoryResponse,
    ProductDetailedResponse,
    ProductPreviewResponse,
    ProductPreviewsPaginatedResponse,
)
from app.features.products.product_service import ProductService

product_router = APIRouter(prefix="/products", tags=["Products"])


def get_product_service(db: AsyncSession = Depends(get_db)) -> ProductService:
    return ProductService(db)


@product_router.get("/categories", response_model=list[ProductCategoryResponse])
async def get_product_categories(
    service: ProductService = Depends(get_product_service),
) -> list[ProductCategoryResponse]:
    return await service.get_product_categories()


@product_router.post("/", status_code=status.HTTP_201_CREATED)
async def add_new_product(
    name: str = Form(...),
    merchant: Merchant = Depends(require_role(Merchant)),
    category: str = Form(...),
    price_cents: int = Form(...),
    description: str = Form(...),
    img_file: UploadFile = File(),
    db: AsyncSession = Depends(get_db),
    service: ProductService = Depends(get_product_service),
):
    try:
        await service.add_new_product(
            name=name,
            merchant=merchant,
            category=category,
            price_cents=price_cents,
            description=description,
            img_file=img_file,
        )
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.get("/previews", response_model=ProductPreviewsPaginatedResponse)
async def get_product_previews(
    limit: int = 10,
    cursor: int | None = None,
    user: User | None = Depends(optional_current_active_user),
    service: ProductService = Depends(get_product_service),
) -> ProductPreviewsPaginatedResponse:
    return await service.get_product_previews(limit, user, cursor)


@product_router.get("/{product_id}", response_model=ProductDetailedResponse)
async def get_product_detailed(
    product_id: int,
    user: User | None = Depends(optional_current_active_user),
    service: ProductService = Depends(get_product_service),
) -> ProductDetailedResponse:
    return await service.get_product_detailed(product_id, user)


@product_router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_product(product_id, merchant.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.post("/{product_id}/like", status_code=status.HTTP_201_CREATED)
async def like_product(
    product_id: int,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        new_like = await service.like_product(product_id, mother)
        db.add(new_like)
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.delete("/{product_id}/unlike", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_product(
    product_id: int,
    mother: PregnantWoman = Depends(require_role(PregnantWoman)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.unlike_product(product_id, mother)
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.get("/likes", response_model=list[ProductPreviewResponse])
async def view_liked_products(
    mother: PregnantWoman = Depends(require_role(PregnantWoman)), service: ProductService = Depends(get_product_service)
) -> list[ProductPreviewResponse]:
    return await service.view_liked_products(mother)

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.security import require_role
from app.core.users_manager import optional_current_active_user
from app.db.db_config import get_db
from app.db.db_schema import Admin, Merchant, PregnantWoman, User
from app.features.products.product_models import (
    CreateProductCategoryRequest,
    ProductCategoryResponse,
    ProductDetailedResponse,
    ProductDraftCreateRequest,
    ProductDraftResponse,
    ProductDraftUpdateRequest,
    ProductPreviewResponse,
    ProductPreviewsPaginatedResponse,
    UpdateProductCategoryRequest,
)
from app.features.products.product_scan import VisionProductScanner
from app.features.products.product_service import ProductService

product_router = APIRouter(prefix="/products", tags=["Products"])

_vision_scanner = VisionProductScanner()


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


@product_router.post("/scan")
async def scan_product_from_image(
    img_file: UploadFile = File(...),
    merchant: Merchant = Depends(require_role(Merchant)),
):
    # Merchant is required (same as add_new_product)
    _ = merchant

    if not img_file.content_type or not img_file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please upload an image file")

    image_bytes = await img_file.read()
    if not image_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")

    try:
        result = await run_in_threadpool(_vision_scanner.scan, image_bytes)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Vision scan failed: {e}")

    return {
        "candidates": result.candidates,
        "raw_text": result.raw_text,
        "labels": result.labels,
    }


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


# =================================================================
# ====================== DRAFT ENDPOINTS ==========================
# =================================================================


@product_router.post("/drafts", status_code=status.HTTP_201_CREATED, response_model=ProductDraftResponse)
async def create_product_draft(
    draft_data: ProductDraftCreateRequest,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
) -> ProductDraftResponse:
    try:
        draft = await service.create_product_draft(merchant, draft_data)
        await db.commit()
        return draft
    except:
        await db.rollback()
        raise


@product_router.get("/drafts", response_model=list[ProductDraftResponse])
async def list_product_drafts(
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
) -> list[ProductDraftResponse]:
    return await service.list_product_drafts(merchant.id)


@product_router.get("/drafts/{draft_id}", response_model=ProductDraftResponse)
async def get_product_draft(
    draft_id: int,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
) -> ProductDraftResponse:
    return await service.get_product_draft(draft_id, merchant.id)


@product_router.patch("/drafts/{draft_id}", response_model=ProductDraftResponse)
async def update_product_draft(
    draft_id: int,
    draft_data: ProductDraftUpdateRequest,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
) -> ProductDraftResponse:
    try:
        draft = await service.update_product_draft(draft_id, merchant.id, draft_data)
        await db.commit()
        return draft
    except:
        await db.rollback()
        raise


@product_router.post("/drafts/{draft_id}/image", status_code=status.HTTP_204_NO_CONTENT)
async def upload_product_draft_image(
    draft_id: int,
    img_file: UploadFile = File(...),
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.upload_product_draft_image(draft_id, merchant.id, img_file)
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.delete("/drafts/{draft_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_draft(
    draft_id: int,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        await service.delete_product_draft(draft_id, merchant.id)
        await db.commit()
    except:
        await db.rollback()
        raise


@product_router.post("/drafts/{draft_id}/publish", status_code=status.HTTP_201_CREATED)
async def publish_product_draft(
    draft_id: int,
    merchant: Merchant = Depends(require_role(Merchant)),
    service: ProductService = Depends(get_product_service),
    db: AsyncSession = Depends(get_db),
):
    try:
        product = await service.publish_product_draft(draft_id, merchant)
        await db.commit()
        return {"message": "Product published successfully", "product_id": product.id}
    except:
        await db.rollback()
        raise


# =================================================================
# ===================== PRODUCT ENDPOINTS ==========================
# =================================================================
# @product_router.post("/", status_code=status.HTTP_201_CREATED)
# async def add_new_product(
#     name: str = Form(...),
#     merchant: Merchant = Depends(require_role(Merchant)),
#     category: str = Form(...),
#     price_cents: int = Form(...),
#     description: str = Form(...),
#     img_file: UploadFile = File(),
#     db: AsyncSession = Depends(get_db),
#     service: ProductService = Depends(get_product_service),
# ):
#     try:
#         await service.add_new_product(
#             name=name,
#             merchant=merchant,
#             category=category,
#             price_cents=price_cents,
#             description=description,
#             img_file=img_file,
#         )
#         await db.commit()
#     except:
#         await db.rollback()
#         raise


# @product_router.get("/previews", response_model=ProductPreviewsPaginatedResponse)
# async def get_product_previews(
#     limit: int = 10,
#     cursor: int | None = None,
#     user: User | None = Depends(optional_current_active_user),
#     service: ProductService = Depends(get_product_service),
# ) -> ProductPreviewsPaginatedResponse:
#     return await service.get_product_previews(limit, user, cursor)


# @product_router.get("/likes", response_model=list[ProductPreviewResponse])
# async def view_liked_products(
#     mother: PregnantWoman = Depends(require_role(PregnantWoman)), service: ProductService = Depends(get_product_service)
# ) -> list[ProductPreviewResponse]:
#     return await service.view_liked_products(mother)


# @product_router.get("/{product_id}", response_model=ProductDetailedResponse)
# async def get_product_detailed(
#     product_id: int,
#     user: User | None = Depends(optional_current_active_user),
#     service: ProductService = Depends(get_product_service),
# ) -> ProductDetailedResponse:
#     return await service.get_product_detailed(product_id, user)


# @product_router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
# async def delete_product(
#     product_id: int,
#     merchant: Merchant = Depends(require_role(Merchant)),
#     service: ProductService = Depends(get_product_service),
#     db: AsyncSession = Depends(get_db),
# ):
#     try:
#         await service.delete_product(product_id, merchant.id)
#         await db.commit()
#     except:
#         await db.rollback()
#         raise


# @product_router.post("/{product_id}/like", status_code=status.HTTP_201_CREATED)
# async def like_product(
#     product_id: int,
#     mother: PregnantWoman = Depends(require_role(PregnantWoman)),
#     service: ProductService = Depends(get_product_service),
#     db: AsyncSession = Depends(get_db),
# ):
#     try:
#         new_like = await service.like_product(product_id, mother)
#         db.add(new_like)
#         await db.commit()
#     except:
#         await db.rollback()
#         raise


# @product_router.delete("/{product_id}/unlike", status_code=status.HTTP_204_NO_CONTENT)
# async def unlike_product(
#     product_id: int,
#     mother: PregnantWoman = Depends(require_role(PregnantWoman)),
#     service: ProductService = Depends(get_product_service),
#     db: AsyncSession = Depends(get_db),
# ):
#     try:
#         await service.unlike_product(product_id, mother)
#         await db.commit()
#     except:
#         await db.rollback()
#         raise


# =================================================================
# ====================== CATEGORY ENDPOINTS =======================
# =================================================================


@product_router.post("/admin/categories", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_product_category(
    request: CreateProductCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: ProductService = Depends(get_product_service),
) -> ProductCategoryResponse:
    try:
        result = await service.create_category(request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise


@product_router.patch("/admin/categories/{category_id}", response_model=ProductCategoryResponse)
async def update_product_category(
    category_id: int,
    request: UpdateProductCategoryRequest,
    _: Admin = Depends(require_role(Admin)),
    db: AsyncSession = Depends(get_db),
    service: ProductService = Depends(get_product_service),
) -> ProductCategoryResponse:
    try:
        result = await service.update_category(category_id, request.label.strip())
        await db.commit()
        return result
    except Exception:
        await db.rollback()
        raise

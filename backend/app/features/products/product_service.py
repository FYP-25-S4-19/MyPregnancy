from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import Merchant, MotherLikeProduct, PregnantWoman, Product, ProductCategory, ProductDraft, User
from app.features.products.product_models import (
    ProductCategoryResponse,
    ProductDetailedResponse,
    ProductDraftCreateRequest,
    ProductDraftResponse,
    ProductDraftUpdateRequest,
    ProductPreviewResponse,
    ProductPreviewsPaginatedResponse,
)
from app.shared.s3_storage_interface import S3StorageInterface
from app.shared.utils import format_user_fullname, get_s3_bucket_prefix


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_product_categories(self) -> list[ProductCategoryResponse]:
        stmt = select(ProductCategory)
        categories = (await self.db.execute(stmt)).scalars().all()
        return [ProductCategoryResponse(id=cat.id, label=cat.label) for cat in categories]

    async def add_new_product(
        self, name: str, merchant: Merchant, category: str, price_cents: int, description: str, img_file: UploadFile
    ) -> None:
        product_category_stmt = select(ProductCategory).where(ProductCategory.label == category)
        product_category = (await self.db.execute(product_category_stmt)).scalar_one_or_none()
        if not product_category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product category")

        new_product = Product(
            name=name,
            merchant=merchant,
            category=product_category,
            price_cents=price_cents,
            description=description,
        )
        self.db.add(new_product)
        await self.db.flush()

        img_key = S3StorageInterface.put_product_img(new_product.id, img_file)
        if not img_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload product image"
            )
        new_product.img_key = img_key

    async def get_product_detailed(self, product_id: int, user: User | None = None) -> ProductDetailedResponse:
        stmt = (
            select(Product)
            .options(
                selectinload(Product.merchant),
                selectinload(Product.category),
                selectinload(Product.liked_by_mothers),
            )
            .where(Product.id == product_id)
        )
        product = (await self.db.execute(stmt)).scalars().first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # Check if the current user (if a mother) has liked this product
        is_liked = False
        if user and isinstance(user, PregnantWoman):
            is_liked = any(like.mother_id == user.id for like in product.liked_by_mothers)

        img_url = (get_s3_bucket_prefix() + product.img_key) if product.img_key else None

        return ProductDetailedResponse(
            id=product.id,
            name=product.name,
            merchant_id=product.merchant_id,
            merchant_name=format_user_fullname(product.merchant),
            category=ProductCategoryResponse(id=product.category.id, label=product.category.label),
            price_cents=product.price_cents,
            description=product.description,
            img_url=img_url,
            is_liked=is_liked,
        )

    async def delete_product(self, product_id: int, merchant_id: UUID) -> None:
        stmt = select(Product).where(Product.id == product_id)
        product = (await self.db.execute(stmt)).scalars().first()
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        if product.merchant_id != merchant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this product. Only the merchant who created it can delete it.",
            )

        # If needed, implement a separate cleanup process for S3 image
        await self.db.delete(product)

    async def get_product_previews(
        self, limit: int, user: User | None = None, cursor: int | None = None
    ) -> ProductPreviewsPaginatedResponse:
        """Get paginated list of products ordered by listed_at (newest first)."""
        query_stmt = (
            select(Product)
            .options(
                selectinload(Product.merchant),
                selectinload(Product.category),
                selectinload(Product.liked_by_mothers),
            )
            .order_by(Product.listed_at.desc(), Product.id.desc())
        )

        # Apply cursor filter if provided
        if cursor is not None:
            # Get the cursor product to get its listed_at timestamp
            cursor_stmt = select(Product).where(Product.id == cursor)
            cursor_product = (await self.db.execute(cursor_stmt)).scalars().first()
            if cursor_product:
                # Use listed_at for ordering, id for tie-breaking
                query_stmt = query_stmt.where(
                    (Product.listed_at < cursor_product.listed_at)
                    | ((Product.listed_at == cursor_product.listed_at) & (Product.id < cursor))
                )

        # Fetch limit + 1 to determine if there are more results
        query_stmt = query_stmt.limit(limit + 1)
        products = (await self.db.execute(query_stmt)).scalars().all()

        # Check if there are more results
        has_more = len(products) > limit
        if has_more:
            products = products[:limit]

        # Determine the next cursor (the id of the last product)
        next_cursor = products[-1].id if products and has_more else None

        # Build preview responses
        product_previews = [
            ProductPreviewResponse(
                id=product.id,
                name=product.name,
                merchant_name=format_user_fullname(product.merchant),
                category=product.category.label,
                price_cents=product.price_cents,
                img_url=(get_s3_bucket_prefix() + product.img_key) if product.img_key else None,
                is_liked=(
                    any(like.mother_id == user.id for like in product.liked_by_mothers)
                    if user and isinstance(user, PregnantWoman)
                    else False
                ),
            )
            for product in products
        ]

        return ProductPreviewsPaginatedResponse(
            products=product_previews,
            next_cursor=next_cursor,
            has_more=has_more,
        )

    async def like_product(self, product_id: int, mother: PregnantWoman) -> MotherLikeProduct:
        """Like a product. Only mothers can like products."""
        # Verify product exists
        stmt = select(Product).where(Product.id == product_id)
        product = (await self.db.execute(stmt)).scalars().first()

        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        # Check if mother already liked this product
        like_stmt = select(MotherLikeProduct).where(
            MotherLikeProduct.product_id == product_id, MotherLikeProduct.mother_id == mother.id
        )
        existing_like = (await self.db.execute(like_stmt)).scalars().first()

        if existing_like:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product already liked")

        return MotherLikeProduct(product_id=product_id, mother_id=mother.id)

    async def unlike_product(self, product_id: int, mother: PregnantWoman) -> None:
        """Unlike a product. Only mothers can unlike products."""
        # Find the existing like
        stmt = select(MotherLikeProduct).where(
            MotherLikeProduct.product_id == product_id, MotherLikeProduct.mother_id == mother.id
        )
        like = (await self.db.execute(stmt)).scalars().first()

        if not like:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Like not found")

        await self.db.delete(like)

    async def view_liked_products(self, mother: PregnantWoman) -> list[ProductPreviewResponse]:
        stmt = (
            select(Product)
            .join(MotherLikeProduct, MotherLikeProduct.product_id == Product.id)
            .options(
                selectinload(Product.merchant),
                selectinload(Product.category),
            )
            .where(MotherLikeProduct.mother_id == mother.id)
        )
        products = (await self.db.execute(stmt)).scalars().all()

        return [
            ProductPreviewResponse(
                id=product.id,
                name=product.name,
                merchant_name=format_user_fullname(product.merchant),
                category=product.category.label,
                price_cents=product.price_cents,
                img_url=(get_s3_bucket_prefix() + product.img_key) if product.img_key else None,
                is_liked=True,
            )
            for product in products
        ]

    # =================================================================
    # ====================== DRAFT METHODS ============================
    # =================================================================

    async def create_product_draft(
        self, merchant: Merchant, draft_data: ProductDraftCreateRequest
    ) -> ProductDraftResponse:
        """Create a new product draft for a merchant."""
        # Validate category if provided
        if draft_data.category_id is not None:
            category_stmt = select(ProductCategory).where(ProductCategory.id == draft_data.category_id)
            category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if not category:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product category")

        new_draft = ProductDraft(
            merchant_id=merchant.id,
            name=draft_data.name,
            category_id=draft_data.category_id,
            price_cents=draft_data.price_cents,
            description=draft_data.description,
        )
        self.db.add(new_draft)
        await self.db.flush()

        return await self._build_draft_response(new_draft)

    async def get_product_draft(self, draft_id: int, merchant_id: UUID) -> ProductDraftResponse:
        """Get a single product draft. Only the owning merchant can view."""
        stmt = select(ProductDraft).where(ProductDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product draft not found")

        if draft.merchant_id != merchant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this draft",
            )

        return await self._build_draft_response(draft)

    async def list_product_drafts(self, merchant_id: UUID) -> list[ProductDraftResponse]:
        """List all product drafts for a merchant."""
        stmt = (
            select(ProductDraft).where(ProductDraft.merchant_id == merchant_id).order_by(ProductDraft.updated_at.desc())
        )
        drafts = (await self.db.execute(stmt)).scalars().all()

        return [await self._build_draft_response(draft) for draft in drafts]

    async def update_product_draft(
        self, draft_id: int, merchant_id: UUID, draft_data: ProductDraftUpdateRequest
    ) -> ProductDraftResponse:
        """Update a product draft. Only the owning merchant can update."""
        stmt = select(ProductDraft).where(ProductDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product draft not found")

        if draft.merchant_id != merchant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this draft",
            )

        # Validate category if being updated
        if draft_data.category_id is not None:
            category_stmt = select(ProductCategory).where(ProductCategory.id == draft_data.category_id)
            category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if not category:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product category")

        # Update fields (only if provided in request)
        if draft_data.name is not None:
            draft.name = draft_data.name
        if draft_data.category_id is not None:
            draft.category_id = draft_data.category_id
        if draft_data.price_cents is not None:
            draft.price_cents = draft_data.price_cents
        if draft_data.description is not None:
            draft.description = draft_data.description

        await self.db.flush()
        return await self._build_draft_response(draft)

    async def upload_product_draft_image(self, draft_id: int, merchant_id: UUID, img_file: UploadFile) -> None:
        """Upload or replace image for a product draft."""
        stmt = select(ProductDraft).where(ProductDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product draft not found")

        if draft.merchant_id != merchant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this draft",
            )

        # Upload to S3 using a special prefix for drafts
        img_key = S3StorageInterface.put_product_draft_img(draft.id, img_file)
        if not img_key:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to upload draft image",
            )
        draft.img_key = img_key

    async def delete_product_draft(self, draft_id: int, merchant_id: UUID) -> None:
        """Delete a product draft. Only the owning merchant can delete."""
        stmt = select(ProductDraft).where(ProductDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product draft not found")

        if draft.merchant_id != merchant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this draft",
            )

        await self.db.delete(draft)

    async def publish_product_draft(self, draft_id: int, merchant: Merchant) -> Product:
        """Publish a draft as a live product. Validates all required fields are present."""
        stmt = select(ProductDraft).where(ProductDraft.id == draft_id)
        draft = (await self.db.execute(stmt)).scalar_one_or_none()

        if not draft:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product draft not found")

        if draft.merchant_id != merchant.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to publish this draft",
            )

        # Validate all required fields are present
        if not draft.name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product name is required")
        if draft.category_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product category is required")
        if draft.price_cents is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product price is required")
        if not draft.description:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product description is required")
        if not draft.img_key:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product image is required")

        # Get the category
        category_stmt = select(ProductCategory).where(ProductCategory.id == draft.category_id)
        category = (await self.db.execute(category_stmt)).scalar_one_or_none()
        if not category:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product category")

        # Create the published product
        new_product = Product(
            name=draft.name,
            merchant=merchant,
            category=category,
            price_cents=draft.price_cents,
            description=draft.description,
        )
        self.db.add(new_product)
        await self.db.flush()

        # Copy/promote the draft image to the product image location
        if draft.img_key:
            # Promote the image from draft storage to product storage
            img_key = S3StorageInterface.promote_product_draft_img(new_product.id, draft.img_key)
            if img_key:
                new_product.img_key = img_key
            else:
                # Fallback: just use the draft img_key if promotion fails
                new_product.img_key = draft.img_key

        # Delete the draft after successful publication
        await self.db.delete(draft)

        return new_product

    async def _build_draft_response(self, draft: ProductDraft) -> ProductDraftResponse:
        """Helper to build a ProductDraftResponse from a ProductDraft entity."""
        category_label = None
        if draft.category_id is not None:
            category_stmt = select(ProductCategory).where(ProductCategory.id == draft.category_id)
            category = (await self.db.execute(category_stmt)).scalar_one_or_none()
            if category:
                category_label = category.label

        img_url = (get_s3_bucket_prefix() + draft.img_key) if draft.img_key else None

        return ProductDraftResponse(
            id=draft.id,
            name=draft.name,
            category_id=draft.category_id,
            category_label=category_label,
            price_cents=draft.price_cents,
            description=draft.description,
            img_url=img_url,
            created_at=draft.created_at,
            updated_at=draft.updated_at,
        )

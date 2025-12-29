from uuid import UUID

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.db_schema import Merchant, MotherLikeProduct, PregnantWoman, Product, ProductCategory, User
from app.features.products.product_models import (
    ProductCategoryResponse,
    ProductDetailedResponse,
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

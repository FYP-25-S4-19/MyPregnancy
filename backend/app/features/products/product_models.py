from datetime import datetime
from uuid import UUID

from app.core.custom_base_model import CustomBaseModel


class ProductCategoryResponse(CustomBaseModel):
    id: int
    label: str


class ProductDetailedResponse(CustomBaseModel):
    id: int
    name: str
    merchant_id: UUID
    merchant_name: str
    category: ProductCategoryResponse
    price_cents: int
    description: str
    img_url: str | None
    is_liked: bool = False


class ProductPreviewResponse(CustomBaseModel):
    id: int
    name: str
    merchant_name: str
    category: str
    price_cents: int
    img_url: str | None
    is_liked: bool = False


class ProductPreviewsPaginatedResponse(CustomBaseModel):
    products: list[ProductPreviewResponse]
    next_cursor: int | None
    has_more: bool


class ProductDraftResponse(CustomBaseModel):
    id: int
    name: str | None
    category_id: int | None
    category_label: str | None
    price_cents: int | None
    description: str | None
    img_url: str | None
    created_at: datetime
    updated_at: datetime


class ProductDraftCreateRequest(CustomBaseModel):
    name: str | None = None
    category_id: int | None = None
    price_cents: int | None = None
    description: str | None = None


class ProductDraftUpdateRequest(CustomBaseModel):
    name: str | None = None
    category_id: int | None = None
    price_cents: int | None = None
    description: str | None = None

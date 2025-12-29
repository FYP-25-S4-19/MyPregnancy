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

import { ProductDetailScreen } from "@/src/screens/ProductDetailScreen";
import { useLocalSearchParams } from "expo-router";

export default function MerchantProductDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id || "0");

  return <ProductDetailScreen productId={productId} backRoute="/main/merchant/(home)" showLikeButton={true} />;
}

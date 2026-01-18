import ProductDetailScreen from "@/src/screens/ProductDetailScreen";
import { useLocalSearchParams, router } from "expo-router";

export default function MotherProductDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const productId = parseInt(id || "0");

  return (
    <ProductDetailScreen
      productId={productId}
      onBackPress={() => router.navigate("/main/mother/(home)")}
      showLikeButton={true}
    />
  );
}

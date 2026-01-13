import ShopScreen from "@/src/screens/ShopScreen";
import { router } from "expo-router";

export default function MerchantShopScreen() {
  return <ShopScreen onProductIdPress={(productId) => router.push(`/main/merchant/shop/${productId}`)} />;
}

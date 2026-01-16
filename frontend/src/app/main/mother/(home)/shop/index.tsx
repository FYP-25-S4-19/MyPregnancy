import ShopScreen from "@/src/screens/ShopScreen";
import { router } from "expo-router";

export default function MotherShopScreen() {
  return <ShopScreen onProductIdPress={(productId) => router.push(`/main/mother/shop/${productId}`)} />;
}

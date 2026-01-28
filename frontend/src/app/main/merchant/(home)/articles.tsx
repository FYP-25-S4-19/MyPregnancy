import ArticlesListScreen from "@/src/screens/ArticlesListScreen";
import { router } from "expo-router";

export default function MerchantArticlesScreen() {
  return (
    <ArticlesListScreen
      actor="merchant"
      showBackButton={false}
      onBack={() => router.dismissTo(`/main/merchant/(home)/articles`)}
    />
  );
}

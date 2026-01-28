import ArticlesListScreen from "@/src/screens/ArticlesListScreen";
import { router } from "expo-router";

export default function MotherArticlesScreen() {
  return (
    <ArticlesListScreen
      actor="mother"
      showBackButton={true}
      onBack={() => router.dismissTo(`/main/mother/(home)/articles`)}
    />
  );
}

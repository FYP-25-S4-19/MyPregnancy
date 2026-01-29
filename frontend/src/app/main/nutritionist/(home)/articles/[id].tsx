import { useLocalSearchParams, router } from "expo-router";
import ArticleDetailScreen from "@/src/screens/ArticleDetailScreen";

export default function MotherArticleDetailRoute() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <ArticleDetailScreen articleId={id || ""} onBack={() => router.back()} />;
}

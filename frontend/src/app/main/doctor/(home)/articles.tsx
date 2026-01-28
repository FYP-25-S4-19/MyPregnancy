import ArticlesListScreen from "@/src/screens/ArticlesListScreen";
import { router } from "expo-router";

export default function DoctorArticlesScreen() {
  return (
    <ArticlesListScreen
      actor="doctor"
      showBackButton={false}
      showActionButtons={true}
      onBack={() => router.dismissTo(`/main/doctor/(home)/articles`)}
    />
  );
}

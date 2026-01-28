import { useLocalSearchParams } from "expo-router";
import ThreadScreen from "@/src/screens/ThreadScreen";

export default function ThreadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = parseInt(id as string);

  return <ThreadScreen threadId={threadId} backgroundColor="#FFE8E8" />;
}

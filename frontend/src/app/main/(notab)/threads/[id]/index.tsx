import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/src/shared/authStore";
import ThreadScreen from "@/src/screens/ThreadScreen";

export default function ThreadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = parseInt(id as string);
  const me = useAuthStore((state) => state.me);
  const isGuest = !me;

  return <ThreadScreen threadId={threadId} backgroundColor="#FFE8E8" isGuest={isGuest} />;
}

import ThreadScreen from "@/src/screens/ThreadScreen";
import { useLocalSearchParams } from "expo-router";
import useAuthStore from "@/src/shared/authStore";

export default function ThreadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = parseInt(id as string);
  const me = useAuthStore((state) => state.me);
  const isGuest = !me;

  // return (
  //   <View>
  //     <Text>We are of thread ID: {threadId}</Text>
  //   </View>
  // );
  return <ThreadScreen threadId={threadId} backgroundColor="#FFE8E8" isGuest={isGuest} />;
}

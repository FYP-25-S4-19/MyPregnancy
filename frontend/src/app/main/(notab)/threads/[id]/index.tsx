import ThreadScreen from "@/src/screens/ThreadScreen";
import { useLocalSearchParams } from "expo-router";

export default function ThreadDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const threadId = parseInt(id as string);

  // return (
  //   <View>
  //     <Text>We are of thread ID: {threadId}</Text>
  //   </View>
  // );
  return <ThreadScreen threadId={threadId} backgroundColor="#FFE8E8" />;
}

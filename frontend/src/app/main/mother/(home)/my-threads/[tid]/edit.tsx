import { useLocalSearchParams } from "expo-router";
import { View } from "react-native";

export default function MotherEditThreadPage() {
  const { tid } = useLocalSearchParams();

  return <View>Mother Edit Thread Page for thread of ID: {tid}</View>;
}

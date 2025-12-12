import { useRouter } from "expo-router";
import { Text, TouchableOpacity, StyleSheet } from "react-native";
import useAuthStore from "@/src/shared/authStore";
import { font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MotherHomeScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.clearAuthState);
  const me = useAuthStore((state) => state.me);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{
          fontSize: font.l,
          fontWeight: "600",
          marginBottom: sizes.m,
        }}
      >
        Logged-in as a {me?.role.toLowerCase()}
      </Text>

      <TouchableOpacity style={styles.touchable} onPress={() => signOut()}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Sign out"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/mother/journal")}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Journal"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/mother/articles")}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Articles"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/mother/consultation")}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Consultation"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/mother/chats")}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Chats"}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: "90%",
    paddingVertical: 16,
    borderRadius: 50,
    alignItems: "center",
    marginVertical: 8,
    backgroundColor: "#FFF8F8",
    borderWidth: 1.5,
    borderColor: "#FADADD",
  },
});

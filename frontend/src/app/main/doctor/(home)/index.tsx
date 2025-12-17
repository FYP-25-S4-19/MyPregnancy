import { Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { font, sizes } from "@/src/shared/designSystem";
import useAuthStore from "@/src/shared/authStore";
import { useRouter } from "expo-router";

export default function DoctorHomeScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.clearAuthState);
  const me = useAuthStore((state) => state.me);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text
        style={{
          fontSize: font.l,
          fontWeight: "600",
          marginBottom: sizes.m,
        }}
      >
        Logged in as a {me?.role.toLowerCase()}
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
      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/doctor/articles")}>
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
      <TouchableOpacity style={styles.touchable} onPress={() => router.push("/main/doctor/threads")}>
        <Text
          style={{
            color: "#6d2828",
            fontSize: font.m,
            fontWeight: "500",
          }}
        >
          {"Threads"}
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

import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

export default function SubmissionSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={48} color={colors.white} />
        </View>

        <Text style={styles.title}>Submission Successful!</Text>

        <Text style={styles.body}>
          Thank you for your submission.{"\n"}
          Our team will review your{"\n"}
          application and notify you by email{"\n"}
          within 3–5 working days.
        </Text>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(intro)/login")}
          activeOpacity={0.9}
        >
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.xl,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
    marginBottom: sizes.xl,
  },
  title: {
    color: colors.text,
    fontSize: font.xl,
    fontWeight: "800",
    marginBottom: sizes.l,
    textAlign: "center",
  },
  body: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: font.s + 10,
    marginBottom: sizes.xxl,
  },
  backBtn: {
    width: "85%",
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.lightGray,
    backgroundColor: colors.white,
  },
  backBtnText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "700",
  },
});
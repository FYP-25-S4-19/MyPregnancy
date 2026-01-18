import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import * as DS from "@/src/shared/designSystem";
const COLORS = (DS as any).COLORS ?? (DS as any).colors ?? {};
const PINK = COLORS.PINK ?? "#FADADD";
const MAROON = COLORS.MAROON ?? "#6d2828";

export default function RegistrationSuccess() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: PINK, alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <Text style={{ color: "#fff", fontSize: 56 }}>✓</Text>
      </View>

      <Text style={{ fontSize: 28, fontWeight: "700", color: MAROON, marginBottom: 14 }}>
        Submission Successful!
      </Text>

      <Text style={{ textAlign: "center", color: MAROON, opacity: 0.9, lineHeight: 22 }}>
        Thank you for your submission.{"\n"}
        Our team will review your application and notify you by email{"\n"}
        within 3–5 working days.
      </Text>

      <TouchableOpacity
        onPress={() => router.replace("/(intro)/login")}
        style={{ marginTop: 34, borderWidth: 1, borderColor: "#ddd", borderRadius: 999, paddingVertical: 12, paddingHorizontal: 36 }}
      >
        <Text style={{ color: MAROON, fontWeight: "600" }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}
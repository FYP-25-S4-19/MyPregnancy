import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/src/shared/api";

// Use designSystem if present, fallback if not (won’t crash)
import * as DS from "@/src/shared/designSystem";
const COLORS = (DS as any).COLORS ?? (DS as any).colors ?? {};
const PINK = COLORS.PINK ?? "#FADADD";
const MAROON = COLORS.MAROON ?? "#6d2828";
const LIGHT = COLORS.LIGHT ?? "#FFF8F8";

type RegisterRole = "ADMIN" | "DOCTOR" | "NUTRITIONIST" | "PREGNANT_WOMAN" | "MERCHANT";

export default function RegisterScreen() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // backend doesn’t accept DOB in /auth/register (keep UI, don’t send)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // If you need role selection later, plug it in here.
  // For now (safe default), register as PREGNANT_WOMAN unless your flow says otherwise.
  const role: RegisterRole = "PREGNANT_WOMAN";

  const [loading, setLoading] = useState(false);

  const nameParts = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return { first_name: "", last_name: "" };
    const parts = trimmed.split(/\s+/);
    const first_name = parts[0] ?? "";
    const last_name = parts.length > 1 ? parts.slice(1).join(" ") : "";
    return { first_name, last_name };
  }, [fullName]);

  async function onSubmit() {
    if (!email.trim()) return Alert.alert("Registration Failed", "Email is required.");
    if (!password) return Alert.alert("Registration Failed", "Password is required.");
    if (password !== confirmPassword)
      return Alert.alert("Registration Failed", "Passwords do not match.");
    if (!nameParts.first_name)
      return Alert.alert("Registration Failed", "Name is required.");

    setLoading(true);

    try {
      // Swagger shows these fields exist; keep minimal required.
      // If your backend makes some optional, it will ignore extras.
      const payload = {
        email: email.trim().toLowerCase(),
        password,
        is_active: true,
        is_superuser: false,
        is_verified: false,
        first_name: nameParts.first_name,
        middle_name: "",
        last_name: nameParts.last_name,
        role,
      };

      await api.post("/auth/register", payload);

      // Registration successful screen (your design)
      // If you don’t have this screen yet, route to login instead.
      router.push("/(intro)/registrationSuccess");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Registration Failed", String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
        {/* Back */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: PINK,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 18 }}>←</Text>
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 36,
            color: MAROON,
            marginBottom: 30,
            letterSpacing: 1,
          }}
        >
          HELLO!{"\n"}REGISTER NOW
        </Text>

        <Label text="Name" />
        <Input value={fullName} onChangeText={setFullName} placeholder="" />

        <Label text="Date of Birth" />
        <Input value={dob} onChangeText={setDob} placeholder="" />

        <Label text="Email" />
        <Input value={email} onChangeText={setEmail} placeholder="" autoCapitalize="none" />

        <Label text="Password" />
        <Input value={password} onChangeText={setPassword} placeholder="" secureTextEntry />

        <Label text="Confirm Password" />
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder=""
          secureTextEntry
        />

        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          style={{
            marginTop: 20,
            backgroundColor: PINK,
            borderRadius: 999,
            paddingVertical: 14,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: MAROON, fontWeight: "600" }}>
            {loading ? "Registering..." : "Register"}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: "#999" }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(intro)/login")}>
            <Text style={{ color: "#2d6cdf", marginTop: 6 }}>Login Now</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={{ marginTop: 20, alignItems: "center" }}>
          <Text style={{ color: "#bbb" }}>or continue with</Text>
        </View>

        {/* Social icons can be added later */}
        <View style={{ height: 40 }} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontWeight: "600", marginBottom: 6 }}>{text}</Text>;
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        backgroundColor: "#fff",
      }}
    />
  );
}
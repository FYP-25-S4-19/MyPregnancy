import React, { useState } from "react";
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
import useAuthStore from "@/src/shared/authStore";
import { colors, sizes } from "@/src/shared/designSystem";
import axios from "axios";

function extractNiceError(e: any): string {
  // Axios errors
  if (axios.isAxiosError(e)) {
    const data = e.response?.data;

    // FastAPI 422 looks like: { detail: [ { loc: [...], msg: "...", type: "..." }, ... ] }
    if (data?.detail) {
      if (Array.isArray(data.detail)) {
        return data.detail
          .map((d: any) => {
            const loc = Array.isArray(d.loc) ? d.loc.join(".") : "";
            const msg = d.msg ?? JSON.stringify(d);
            return loc ? `${loc}: ${msg}` : String(msg);
          })
          .join("\n");
      }
      if (typeof data.detail === "string") return data.detail;
      return JSON.stringify(data.detail);
    }

    // Other backends may return message/errors
    if (data?.message) return String(data.message);

    // Fallback to status + generic
    return `Request failed (${e.response?.status ?? "no status"}).`;
  }

  // Non-axios errors
  return e?.message ? String(e.message) : "Unknown error.";
}

export default function LoginScreen() {
  const router = useRouter();

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setMe = useAuthStore((s) => s.setMe);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Login Failed", "Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      // ✅ FastAPI OAuth2PasswordRequestForm expects x-www-form-urlencoded
      const form = new URLSearchParams();
      form.append("username", email.trim().toLowerCase());
      form.append("password", password);

      const loginRes = await api.post("/auth/jwt/login", form.toString(), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      const token = loginRes?.data?.access_token;
      if (!token) throw new Error("No access_token returned from server.");

      // 1) Save token
      setAccessToken(token);

      // 2) Fetch current user (✅ your interceptor will attach token)
      const meRes = await api.get("/users/me");
      setMe(meRes.data);

      // 3) Route forward
      router.replace("/main");
    } catch (e: any) {
      Alert.alert("Login Failed", extractNiceError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.veryLightPink ?? "#FFF8F8" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: sizes.l, paddingTop: 80 }}>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.text ?? "#6d2828" }}>
          Welcome back
        </Text>

        <View style={{ height: sizes.l }} />

        <Text style={{ fontWeight: "700", marginBottom: 6, color: colors.text ?? "#333" }}>
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: sizes.m,
            borderWidth: 1,
            borderColor: "#eee",
          }}
        />

        <Text style={{ fontWeight: "700", marginBottom: 6, color: colors.text ?? "#333" }}>
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            backgroundColor: "#fff",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginBottom: sizes.l,
            borderWidth: 1,
            borderColor: "#eee",
          }}
        />

        <TouchableOpacity
          onPress={onLogin}
          disabled={loading}
          style={{
            backgroundColor: colors.secondary ?? "#FADADD",
            paddingVertical: 14,
            borderRadius: 999,
            alignItems: "center",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <Text style={{ color: colors.text ?? "#6d2828", fontWeight: "800" }}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: sizes.l, alignItems: "center" }}>
          <Text style={{ opacity: 0.7, color: colors.text ?? "#333" }}>
            No account yet?
          </Text>
          <TouchableOpacity onPress={() => router.push("/(intro)/whoAreYouJoiningAs")}>
            <Text
              style={{
                marginTop: 6,
                fontWeight: "800",
                textDecorationLine: "underline",
                color: colors.text ?? "#333",
              }}
            >
              Register →
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
import { View, TextInput, StyleSheet, Text, TouchableOpacity, Alert } from "react-native";
import { colors, font, sizes } from "@/src/shared/designSystem";
import { SafeAreaView } from "react-native-safe-area-context";
import { MeData } from "@/src/shared/typesAndInterfaces";
import useAuthStore from "@/src/shared/authStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { router } from "expo-router";
import api from "@/src/shared/api";

interface LoginResponse {
  access_token: string;
  token_type: string;
}

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const { setMe, setAccessToken, clearAuthState } = useAuthStore((state) => state);

  const handleLogin = async () => {
    const emailTrim = email.trim();
    const passwordTrim = password.trim();

    if (!emailTrim || !passwordTrim) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    try {
      const params = new URLSearchParams();
      params.append("username", emailTrim);
      params.append("password", passwordTrim);

      const loginRes = await api.post<LoginResponse>("/auth/jwt/login", params.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const accessToken = loginRes.data.access_token;
      setAccessToken(accessToken);

      jwtDecode(accessToken);

      const meRes = await api.get<MeData>("/users/me");
      setMe(meRes.data);

      router.replace("/(onboarding)/pregnancy-details");
    } catch (err) {
      console.error(err);
      clearAuthState();
      Alert.alert("Login Failed", "Invalid credentials or server error.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>WELCOME</Text>
        <Text style={styles.titleText}>BACK!</Text>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Email */}
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
        />

        {/* Password */}
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="done"
        />

        {/* Forgot Password */}
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>

        {/* Register Link */}
        <View style={styles.registerContainer}>
          <Text style={styles.plainText}>Don’t have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/onboarding")}>
            <Text style={styles.linkText}>Register Now</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <Text style={styles.dividerText}>or continue with</Text>

        {/* Social Buttons */}
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-facebook" size={30} color="#1877F2" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-apple" size={30} color="#000000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={30} color="#EA4335" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: sizes.l,
  },
  header: {
    marginTop: sizes.s,
    marginBottom: sizes.l,
    alignItems: "flex-start",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  titleContainer: {
    marginBottom: sizes.xl,
    alignItems: "center",
  },
  titleText: {
    fontSize: 36,
    fontWeight: "300",
    color: colors.text,
    fontFamily: "System",
    textTransform: "uppercase",
    lineHeight: 40,
  },
  formContainer: {
    paddingHorizontal: sizes.xs,
  },
  label: {
    fontSize: font.s,
    fontWeight: "600",
    color: colors.black,
    marginBottom: sizes.xs,
    marginTop: sizes.m,
    marginLeft: sizes.xs,
  },
  input: {
    height: 42,
    borderColor: colors.lightGray,
    borderWidth: 1,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    fontSize: font.s,
    color: colors.black,
    backgroundColor: colors.white,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: sizes.s,
    marginBottom: sizes.xl,
  },
  linkText: {
    fontSize: font.s,
    color: "#5B5BFF",
    fontWeight: "600",
  },
  plainText: {
    fontSize: font.s,
    color: colors.black,
  },
  loginButton: {
    height: 50,
    backgroundColor: colors.secondary,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: sizes.l,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButtonText: {
    fontSize: font.m,
    fontWeight: "500",
    color: colors.text,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: sizes.xl,
  },
  dividerText: {
    fontSize: font.s,
    color: "#AAAAAA",
    textAlign: "center",
    marginBottom: sizes.l,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: sizes.l,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
});

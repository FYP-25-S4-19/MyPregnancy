import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons, FontAwesome, AntDesign } from "@expo/vector-icons";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

type RoleParam = "mom" | "specialist" | undefined;

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: RoleParam }>();
  const role = params.role;

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMatch = password.length === 0 || confirmPassword.length === 0 || password === confirmPassword;

  const canRegister = useMemo(() => {
    if (!name.trim() || !dob.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) return false;
    if (password !== confirmPassword) return false;
    return true;
  }, [name, dob, email, password, confirmPassword]);

  const onRegister = () => {
    // TODO: connect to real register API
    // role is available if you need it:
    // console.log("Register role:", role);

    router.push("/main");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <Ionicons name="chevron-back" size={sizes.icon} color={colors.text} />
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>
            hello!{"\n"}register now
          </Text>

          {/* Optional role indicator (subtle) */}
          {role ? (
            <Text style={styles.roleHint}>
              Registering as: <Text style={styles.roleHintStrong}>{role === "mom" ? "Mom-to-be" : "Specialist"}</Text>
            </Text>
          ) : null}

          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            style={styles.input}
          />

          {/* DOB */}
          <Text style={[styles.label, { marginTop: sizes.m }]}>Date of Birth</Text>
          <TextInput
            value={dob}
            onChangeText={setDob}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            style={styles.input}
          />

          {/* Email */}
          <Text style={[styles.label, { marginTop: sizes.m }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          {/* Password */}
          <Text style={[styles.label, { marginTop: sizes.m }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            secureTextEntry
            style={styles.input}
          />

          {/* Confirm */}
          <Text style={[styles.label, { marginTop: sizes.m }]}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            secureTextEntry
            style={styles.input}
          />

          {!passwordsMatch ? <Text style={styles.error}>Passwords do not match.</Text> : null}

          {/* Register button */}
          <TouchableOpacity
            style={[styles.primaryBtn, !canRegister && styles.disabledBtn]}
            onPress={onRegister}
            disabled={!canRegister}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryBtnText}>Register</Text>
          </TouchableOpacity>

          {/* Login link */}
          <View style={styles.inlineRow}>
            <Text style={styles.inlineText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/(intro)/login")} activeOpacity={0.8}>
              <Text style={styles.inlineLink}>Login Now</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <Text style={styles.divider}>or continue with</Text>

          {/* Social */}
          <View style={styles.socialRow}>
            <TouchableOpacity style={[styles.socialBtn, styles.fb]} onPress={() => {}} activeOpacity={0.85}>
              <FontAwesome name="facebook-f" size={sizes.icon} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialBtn, styles.apple]} onPress={() => {}} activeOpacity={0.85}>
              <AntDesign name="apple1" size={sizes.icon} color={colors.white} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialBtn, styles.google]} onPress={() => {}} activeOpacity={0.85}>
              <AntDesign name="google" size={sizes.icon} color={colors.white} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  kav: { flex: 1 },
  container: {
    paddingHorizontal: sizes.xl,
    paddingTop: sizes.l,
    paddingBottom: sizes.xxl,
  },

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: sizes.l,
  },

  title: {
    textAlign: "center",
    color: colors.text,
    fontSize: font.xxl,
    fontWeight: "700",
    lineHeight: font.xxl + 6,
    marginBottom: sizes.m,
    textTransform: "uppercase",
  },

  roleHint: {
    textAlign: "center",
    color: colors.tabIcon,
    fontSize: font.xs,
    marginBottom: sizes.l,
  },
  roleHintStrong: {
    color: colors.text,
    fontWeight: "700",
  },

  label: {
    color: colors.black,
    fontSize: font.xs,
    fontWeight: "600",
    marginBottom: sizes.s,
  },

  input: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    fontSize: font.xs,
    color: colors.black,
    backgroundColor: colors.white,
  },

  error: {
    marginTop: sizes.s,
    color: colors.fail,
    fontSize: font.xs,
    fontWeight: "600",
  },

  primaryBtn: {
    marginTop: sizes.xl,
    backgroundColor: colors.secondary,
    borderRadius: 999,
    paddingVertical: sizes.m,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  primaryBtnText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "700",
  },
  disabledBtn: { opacity: 0.55 },

  inlineRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: sizes.m,
  },
  inlineText: {
    color: colors.black,
    fontSize: font.xs,
  },
  inlineLink: {
    color: colors.primary,
    fontSize: font.xs,
    fontWeight: "700",
    textDecorationLine: "underline",
  },

  divider: {
    textAlign: "center",
    marginTop: sizes.xl,
    color: colors.tabIcon,
    fontSize: font.xs,
  },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: sizes.l,
    gap: sizes.l,
  },
  socialBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.small,
  },
  fb: { backgroundColor: colors.primary },
  apple: { backgroundColor: colors.black },
  google: { backgroundColor: colors.orange },
});
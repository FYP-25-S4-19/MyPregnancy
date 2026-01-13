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
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import api from "@/src/shared/api";
import useAuthStore from "@/src/shared/authStore";

// Use designSystem if present, fallback if not (won’t crash)
import * as DS from "@/src/shared/designSystem";
const COLORS = (DS as any).COLORS ?? (DS as any).colors ?? {};
const PINK = COLORS.PINK ?? "#FADADD";
const MAROON = COLORS.MAROON ?? "#6d2828";
const LIGHT = COLORS.LIGHT ?? "#FFF8F8";

type DirectRegisterRole = "PREGNANT_WOMAN" | "MERCHANT";
type SpecialistType = "DOCTOR" | "NUTRITIONIST";

function normalizeMcr(input: string) {
  return input.trim().toUpperCase();
}

function extractErrorMessage(e: any): string {
  const data = e?.response?.data;
  const detail = data?.detail ?? data;

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) || typeof detail === "object") return JSON.stringify(detail, null, 2);

  return e?.message || "Registration failed. Please try again.";
}

/**
 * IMPORTANT:
 * Expo image picker sometimes returns:
 * - iOS: ph://...
 * - Android: content://...
 * Axios/FormData upload often fails (Network Error) unless we copy it to a local file:// URI.
 */
async function ensureFileUri(uri: string, suggestedName: string) {
  if (uri.startsWith("file://")) return { uri, name: suggestedName };

  const ext = suggestedName.split(".").pop() || "jpg";
  const target = `${FileSystem.cacheDirectory}${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.${ext}`;

  await FileSystem.copyAsync({ from: uri, to: target });
  return { uri: target, name: suggestedName };
}

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: string }>();

  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const setMe = useAuthStore((s) => s.setMe);

  // expected: "mom" | "merchant" | "specialist"
  const entryRole = (params?.role ?? "mom").toString();

  const [specialistType, setSpecialistType] = useState<SpecialistType>("DOCTOR");

  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState(""); // UI only (not sent)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [mcrNumber, setMcrNumber] = useState("");

  const [qualificationImg, setQualificationImg] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const nameParts = useMemo(() => {
    const trimmed = fullName.trim();
    if (!trimmed) return { first_name: "", last_name: "" };

    const parts = trimmed.split(/\s+/);

    // If user types only one word, backend still requires last_name
    if (parts.length === 1) {
      return { first_name: parts[0], last_name: parts[0] };
    }

    return { first_name: parts[0], last_name: parts.slice(1).join(" ") };
  }, [fullName]);

  const isSpecialist = entryRole === "specialist";
  const isDirectRegister = entryRole === "mom" || entryRole === "merchant";

  async function pickQualificationImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo access to upload your qualification.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.9,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    // Prefer fileName/mimeType if available (newer expo)
    const guessedExt =
      asset.fileName?.split(".").pop()?.toLowerCase() ||
      asset.uri.split(".").pop()?.toLowerCase() ||
      "jpg";

    const name = asset.fileName || `qualification.${guessedExt}`;
    const type =
      asset.mimeType ||
      (guessedExt === "png" ? "image/png" : guessedExt === "heic" ? "image/heic" : "image/jpeg");

    // convert to file:// if needed
    const fixed = await ensureFileUri(asset.uri, name);

    setQualificationImg({ uri: fixed.uri, name: fixed.name, type });
  }

  async function isMcrValid(mcr: string): Promise<boolean> {
    try {
      const res = await api.get("/avail-mcr");
      const list: string[] = Array.isArray(res.data) ? res.data : [];
      const normalized = normalizeMcr(mcr);
      return list.map((x) => normalizeMcr(String(x))).includes(normalized);
    } catch {
      return false;
    }
  }

  function validateCommonFields() {
    if (!email.trim()) return "Email is required.";
    if (!password) return "Password is required.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!nameParts.first_name) return "Name is required.";
    return null;
  }

  async function doLoginAfterRegister() {
    // OAuth2PasswordRequestForm expects form data
    const form = new URLSearchParams();
    form.append("username", email.trim().toLowerCase());
    form.append("password", password);

    const loginRes = await api.post("/auth/jwt/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const token = loginRes?.data?.access_token;
    if (!token) throw new Error("No access token returned after registration.");

    setAccessToken(token);

    const meRes = await api.get("/users/me");
    setMe(meRes.data);
  }

  async function submitDirectRegister(role: DirectRegisterRole) {
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
  }

  async function submitSpecialistRequest(type: SpecialistType) {
  if (!qualificationImg) {
    throw new Error("Qualification image is required.");
  }

  // Doctor must have valid MCR before submission
  if (type === "DOCTOR") {
    const mcr = normalizeMcr(mcrNumber);
    if (!mcr) throw new Error("MCR number is required for doctors.");

    const ok = await isMcrValid(mcr);
    if (!ok) throw new Error("Invalid MCR number. Please check and try again.");
  }

  const form = new FormData();
  form.append("email", email.trim().toLowerCase());
  form.append("password", password);
  form.append("first_name", nameParts.first_name);
  form.append("middle_name", "");
  form.append("last_name", nameParts.last_name);

  if (type === "DOCTOR") {
    form.append("mcr_number", normalizeMcr(mcrNumber));
  }

  // MUST be file:// for iOS uploads. If it's ph:// or content://, it can break.
  // If your picker returns ph://, you must convert it (see next section).
  form.append("qualification_img", {
    uri: qualificationImg.uri,
    name: qualificationImg.name,
    type: qualificationImg.type,
  } as any);

  const endpoint =
    type === "DOCTOR" ? "/account-requests/doctors" : "/account-requests/nutritionists";

  const baseUrl = (api.defaults.baseURL || "").replace(/\/$/, "");
  const url = `${baseUrl}${endpoint}`;

  // IMPORTANT: Do NOT set Content-Type manually. fetch will set boundary correctly.
  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text(); // backend may return json or plain text
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
}

  async function onSubmit() {
    const err = validateCommonFields();
    if (err) return Alert.alert("Registration Failed", err);

    setLoading(true);
    try {
      if (isDirectRegister) {
        const role: DirectRegisterRole = entryRole === "merchant" ? "MERCHANT" : "PREGNANT_WOMAN";
        await submitDirectRegister(role);

        // ✅ AUTO LOGIN DIRECT USERS (mom/merchant)
        await doLoginAfterRegister();
        router.replace("/main");
        return;
      }

      if (isSpecialist) {
        await submitSpecialistRequest(specialistType);
        Alert.alert(
          "Request submitted",
          "Your account creation request has been submitted. An admin will review it shortly.",
        );
        router.replace("/(intro)/login");
        return;
      }

      throw new Error("Unknown registration role.");
    } catch (e: any) {
      // helpful debug in terminal
      console.log("REGISTER ERROR FULL:", e);
      console.log("REGISTER ERROR RESPONSE STATUS:", e?.response?.status);
      console.log("REGISTER ERROR RESPONSE DATA:", e?.response?.data);
      Alert.alert("Registration Failed", extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: LIGHT }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60 }}>
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

        <Text style={{ fontSize: 34, color: MAROON, marginBottom: 14, letterSpacing: 1 }}>
          {isSpecialist ? "SPECIALIST\nREQUEST" : "HELLO!\nREGISTER NOW"}
        </Text>

        {isDirectRegister && (
          <Text style={{ color: "#666", marginBottom: 18 }}>
            You are registering as:{" "}
            <Text style={{ fontWeight: "700" }}>
              {entryRole === "merchant" ? "Merchant" : "Mom-to-be"}
            </Text>
          </Text>
        )}

        {isSpecialist && (
          <View style={{ marginBottom: 18 }}>
            <Text style={{ fontWeight: "700", marginBottom: 8, color: MAROON }}>
              Specialist type
            </Text>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => setSpecialistType("DOCTOR")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: specialistType === "DOCTOR" ? PINK : "#fff",
                  borderWidth: 1,
                  borderColor: specialistType === "DOCTOR" ? PINK : "#ddd",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: MAROON, fontWeight: "700" }}>Doctor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSpecialistType("NUTRITIONIST")}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: specialistType === "NUTRITIONIST" ? PINK : "#fff",
                  borderWidth: 1,
                  borderColor: specialistType === "NUTRITIONIST" ? PINK : "#ddd",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: MAROON, fontWeight: "700" }}>Nutritionist</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <Label text="Name" />
        <Input value={fullName} onChangeText={setFullName} placeholder="" />

        <Label text="Date of Birth (optional)" />
        <Input value={dob} onChangeText={setDob} placeholder="" />

        <Label text="Email" />
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder=""
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Label text="Password" />
        <Input value={password} onChangeText={setPassword} placeholder="" secureTextEntry />

        <Label text="Confirm Password" />
        <Input
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder=""
          secureTextEntry
        />

        {isSpecialist && specialistType === "DOCTOR" && (
          <>
            <Label text="MCR Number (required for doctors)" />
            <Input
              value={mcrNumber}
              onChangeText={setMcrNumber}
              placeholder="e.g. M12345A"
              autoCapitalize="characters"
            />
          </>
        )}

        {isSpecialist && (
          <View style={{ marginBottom: 10 }}>
            <Label text="Qualification Image (required)" />
            <TouchableOpacity
              onPress={pickQualificationImage}
              style={{
                backgroundColor: "#fff",
                borderWidth: 1,
                borderColor: "#ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <Text style={{ color: MAROON, fontWeight: "700" }}>
                {qualificationImg ? "Change Image" : "Upload Image"}
              </Text>
              <Text style={{ marginTop: 6, color: "#666" }}>
                {qualificationImg ? qualificationImg.name : "No file selected"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
          <Text style={{ color: MAROON, fontWeight: "700" }}>
            {loading ? "Submitting..." : isSpecialist ? "Submit Request" : "Register"}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={{ color: "#999" }}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push("/(intro)/login")}>
            <Text style={{ color: "#2d6cdf", marginTop: 6 }}>Login Now</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return <Text style={{ fontWeight: "700", marginBottom: 6, color: "#333" }}>{text}</Text>;
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      style={{
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 14,
        backgroundColor: "#fff",
      }}
    />
  );
}
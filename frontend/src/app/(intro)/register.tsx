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
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import api from "@/src/shared/api"; // ✅ uses your existing axios instance
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

type RoleParam = "mom" | "specialist" | undefined;

const SPECIALIST_OPTIONS = ["health care", "nutrition", "mental care", "exercise", "baby care"] as const;
const DOCTOR_NUTRITIONIST_OPTIONS = ["Doctor", "Nutritionist"] as const;

type PickerValue = string;

function SimplePickerModal({
  visible,
  title,
  options,
  onClose,
  onPick,
}: {
  visible: boolean;
  title: string;
  options: readonly string[];
  onClose: () => void;
  onPick: (value: PickerValue) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={pickerStyles.card} onPress={() => {}}>
          <Text style={pickerStyles.title}>{title}</Text>

          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={pickerStyles.option}
              onPress={() => onPick(opt)}
              activeOpacity={0.85}
            >
              <Text style={pickerStyles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={pickerStyles.cancel} onPress={onClose} activeOpacity={0.85}>
            <Text style={pickerStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    paddingHorizontal: sizes.l,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.borderRadius,
    padding: sizes.l,
    ...shadows.small,
  },
  title: {
    fontSize: font.s,
    fontWeight: "700",
    color: colors.text,
    marginBottom: sizes.m,
  },
  option: {
    paddingVertical: sizes.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  optionText: {
    fontSize: font.s,
    color: colors.black,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  cancel: {
    marginTop: sizes.l,
    paddingVertical: sizes.m,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "700",
  },
});

export default function RegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ role?: RoleParam }>();
  const role: RoleParam = params.role;

  // --- base fields
  const [name, setName] = useState("");
  const [dob, setDob] = useState(""); // for mom flow (your earlier figma had DOB)
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState(""); // specialist figma shows Mobile
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- specialist-only fields
  const [doctorOrNutritionist, setDoctorOrNutritionist] = useState<PickerValue>("");
  const [mcrNumber, setMcrNumber] = useState("");
  const [specialistType, setSpecialistType] = useState<PickerValue>("");

  // certificate (optional)
  const [certificateName, setCertificateName] = useState<string>("");
  const [certificateUri, setCertificateUri] = useState<string>("");

  // pickers
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showSpecPicker, setShowSpecPicker] = useState(false);

  // API state
  const [submitting, setSubmitting] = useState(false);

  const isSpecialist = role === "specialist";

  const passwordsMatch =
    password.length === 0 ||
    confirmPassword.length === 0 ||
    password === confirmPassword;

  const canSubmit = useMemo(() => {
    // required for both
    if (!name.trim()) return false;
    if (!email.trim()) return false;
    if (!password.trim()) return false;
    if (!confirmPassword.trim()) return false;
    if (password !== confirmPassword) return false;

    if (isSpecialist) {
      if (!mobile.trim()) return false;
      if (!doctorOrNutritionist) return false;
      if (!mcrNumber.trim()) return false;
      if (!specialistType) return false;
      // certificate not specified -> not required
    } else {
      // mom flow: if your backend wants DOB, keep it required. If not, we can remove later.
      if (!dob.trim()) return false;
    }

    return true;
  }, [
    name,
    dob,
    email,
    mobile,
    password,
    confirmPassword,
    doctorOrNutritionist,
    mcrNumber,
    specialistType,
    isSpecialist,
  ]);

  const pickCertificate = async () => {
    // We avoid hard dependency assumptions: try dynamic import.
    // If expo-document-picker is not installed, we show a helpful message.
    try {
      const DocumentPicker = await import("expo-document-picker");
      const res = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (res.canceled) return;

      const file = res.assets?.[0];
      if (!file?.uri) return;

      setCertificateUri(file.uri);
      setCertificateName(file.name ?? "certificate");
    } catch (e) {
      Alert.alert(
        "Document Picker not available",
        "Your project may not have expo-document-picker installed. Tell your teammate/TA, or share your package.json and I’ll adjust the upload approach."
      );
    }
  };

  const submitRegistration = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      // Payload (JSON) – safe default unless backend requires multipart
      const payload: any = {
        name: name.trim(),
        email: email.trim(),
        password: password,
        role: isSpecialist ? "specialist" : "mom",
      };

      if (isSpecialist) {
        payload.mobile = mobile.trim();
        payload.profession = doctorOrNutritionist; // Doctor / Nutritionist
        payload.mcrNumber = mcrNumber.trim();
        payload.specialistType = specialistType; // health care / nutrition / etc
      } else {
        payload.dateOfBirth = dob.trim();
      }

      // If certificate selected, try multipart form-data (common pattern)
      if (certificateUri) {
        const form = new FormData();
        Object.keys(payload).forEach((k) => form.append(k, String(payload[k])));

        // best-effort file object
        const fileName = certificateName || "certificate";
        const ext = fileName.includes(".") ? fileName.split(".").pop()?.toLowerCase() : "";
        const mime =
          ext === "pdf"
            ? "application/pdf"
            : ext === "png"
              ? "image/png"
              : ext === "jpg" || ext === "jpeg"
                ? "image/jpeg"
                : "application/octet-stream";

        form.append("telemedicineCertificate", {
          uri: certificateUri,
          name: fileName,
          type: mime,
        } as any);

        await api.post("/auth/register", form, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/auth/register", payload);
      }

      router.replace("/(intro)/submissionSuccess");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";
      Alert.alert("Registration Failed", String(msg));
    } finally {
      setSubmitting(false);
    }
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
            HELLO!{"\n"}REGISTER NOW
          </Text>

          {/* MOM FLOW FIELDS */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={styles.input}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
          />

          {/* If you are mom-to-be, include DOB like your earlier figma */}
          {!isSpecialist ? (
            <>
              <Text style={[styles.label, { marginTop: sizes.m }]}>Date of Birth</Text>
              <TextInput
                value={dob}
                onChangeText={setDob}
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.tabIcon}
              />
            </>
          ) : null}

          <Text style={[styles.label, { marginTop: sizes.m }]}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {/* SPECIALIST FLOW fields */}
          {isSpecialist ? (
            <>
              <Text style={[styles.label, { marginTop: sizes.m }]}>Mobile</Text>
              <TextInput
                value={mobile}
                onChangeText={setMobile}
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.tabIcon}
                keyboardType="phone-pad"
              />
            </>
          ) : null}

          <Text style={[styles.label, { marginTop: sizes.m }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            secureTextEntry
          />

          <Text style={[styles.label, { marginTop: sizes.m }]}>Confirm Password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            style={styles.input}
            placeholder=""
            placeholderTextColor={colors.tabIcon}
            secureTextEntry
          />

          {!passwordsMatch ? <Text style={styles.error}>Passwords do not match.</Text> : null}

          {isSpecialist ? (
            <>
              <Text style={[styles.label, { marginTop: sizes.l }]}>Doctor / Nutritionist</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowDocPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownText, !doctorOrNutritionist && styles.placeholder]}>
                  {doctorOrNutritionist || "Select"}
                </Text>
                <Ionicons name="chevron-down" size={sizes.icon} color={colors.tabIcon} />
              </TouchableOpacity>

              <Text style={[styles.label, { marginTop: sizes.m }]}>MCR #</Text>
              <TextInput
                value={mcrNumber}
                onChangeText={setMcrNumber}
                style={styles.input}
                placeholder=""
                placeholderTextColor={colors.tabIcon}
                autoCapitalize="characters"
              />

              <Text style={[styles.label, { marginTop: sizes.m }]}>Specialist</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowSpecPicker(true)}
                activeOpacity={0.85}
              >
                <Text style={[styles.dropdownText, !specialistType && styles.placeholder]}>
                  {specialistType || "Select"}
                </Text>
                <Ionicons name="chevron-down" size={sizes.icon} color={colors.tabIcon} />
              </TouchableOpacity>

              <Text style={[styles.label, { marginTop: sizes.m }]}>Telemedicine Certificate</Text>
              <TouchableOpacity style={styles.uploadBox} onPress={pickCertificate} activeOpacity={0.85}>
                <Ionicons name="image-outline" size={sizes.icon} color={colors.tabIcon} />
                <Text style={styles.uploadText}>
                  {certificateName ? certificateName : "Choose Files to Upload"}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.primaryBtn, (!canSubmit || submitting) && styles.disabledBtn]}
            onPress={submitRegistration}
            disabled={!canSubmit || submitting}
            activeOpacity={0.9}
          >
            {submitting ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <Text style={styles.primaryBtnText}>Register</Text>
            )}
          </TouchableOpacity>

          {/* Already have account */}
          <View style={styles.inlineRow}>
            <Text style={styles.inlineText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace("/(intro)/login")} activeOpacity={0.8}>
              <Text style={styles.inlineLink}>Login Now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Pickers */}
      <SimplePickerModal
        visible={showDocPicker}
        title="Doctor / Nutritionist"
        options={DOCTOR_NUTRITIONIST_OPTIONS}
        onClose={() => setShowDocPicker(false)}
        onPick={(v) => {
          setDoctorOrNutritionist(v);
          setShowDocPicker(false);
        }}
      />

      <SimplePickerModal
        visible={showSpecPicker}
        title="Specialist"
        options={SPECIALIST_OPTIONS}
        onClose={() => setShowSpecPicker(false)}
        onPick={(v) => {
          setSpecialistType(v);
          setShowSpecPicker(false);
        }}
      />
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
    color: colors.text,
    fontSize: font.xxl,
    fontWeight: "700",
    lineHeight: font.xxl + 6,
    marginBottom: sizes.l,
    textTransform: "uppercase",
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

  dropdown: {
    height: 46,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.borderRadius,
    paddingHorizontal: sizes.m,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dropdownText: {
    fontSize: font.xs,
    color: colors.black,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  placeholder: {
    color: colors.tabIcon,
    fontWeight: "500",
  },

  uploadBox: {
    height: 64,
    borderWidth: 1,
    borderColor: colors.lightGray,
    borderRadius: sizes.borderRadius,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.s,
  },
  uploadText: {
    fontSize: font.xs,
    color: colors.black,
    fontWeight: "600",
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
    marginTop: sizes.l,
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
});
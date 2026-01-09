import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { router } from "expo-router";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import { colors, font, sizes, shadows } from "@/src/shared/designSystem";

export default function GuestGateModal() {
  const { isOpen, close, attemptedPath } = useGuestGate();

  const onLogin = () => {
    close();
    router.replace("/(intro)"); // keep your mechanics exactly
  };

  const onStayGuest = () => {
    close(); // close and stay on guest home
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onStayGuest}
    >
      <View style={styles.backdrop}>
        {/* Tap outside to close */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onStayGuest} />

        <View style={styles.card}>
          {/* Close (X) */}
          <TouchableOpacity onPress={onStayGuest} style={styles.closeBtn} activeOpacity={0.7}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Oops..</Text>

          <Text style={styles.subtitle}>
            You need an account to use{"\n"}
            this feature. Sign in or create{"\n"}
            one for free!
          </Text>

          {/* {!!attemptedPath && (
            <Text style={styles.attempted} numberOfLines={1}>
              Attempted: {attemptedPath}
            </Text>
          )} */}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onStayGuest} activeOpacity={0.85}>
              <Text style={[styles.btnText, styles.btnSecondaryText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onLogin} activeOpacity={0.85}>
              <Text style={[styles.btnText, styles.btnPrimaryText]}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.12)", // softer dim like Figma
    justifyContent: "center",
    alignItems: "center",
    padding: sizes.lg,
  },

  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#F6CFCF", // Figma-like pink
    borderRadius: 16,
    paddingVertical: sizes.lg,
    paddingHorizontal: sizes.lg,
    borderWidth: 1,
    borderColor: "rgba(91,43,43,0.18)",
    ...shadows.small,
  },

  closeBtn: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  closeText: {
    fontSize: 22,
    lineHeight: 22,
    color: "#5B2B2B",
    opacity: 0.85,
    fontWeight: "700",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5B2B2B",
    textAlign: "center",
    marginBottom: sizes.sm,
  },

  subtitle: {
    fontSize: 14,
    color: "#5B2B2B",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: sizes.lg,
  },

  attempted: {
    fontSize: 12,
    color: "#5B2B2B",
    opacity: 0.6,
    textAlign: "center",
    marginBottom: sizes.md,
  },

  actions: {
    flexDirection: "row",
    gap: sizes.sm,
    justifyContent: "center",
  },

  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(91,43,43,0.25)",
  },

  btnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B2B2B",
  },

  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  btnSecondaryText: {
    opacity: 0.9,
  },

  btnPrimary: {
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  btnPrimaryText: {
    opacity: 1,
  },
});
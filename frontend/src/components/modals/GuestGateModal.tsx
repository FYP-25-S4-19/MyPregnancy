import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from "react-native";
import { router } from "expo-router";
import { useGuestGate } from "@/src/shared/hooks/useGuestGate";
import { sizes, shadows } from "@/src/shared/designSystem";

export default function GuestGateModal() {
  const { isOpen, close } = useGuestGate();

  const onSignIn = () => {
    close();
    router.replace("/(intro)"); // your login/register area
  };

  const onCancel = () => {
    close();
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        {/* Tap outside closes modal */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        <View style={styles.card}>
          {/* X button (must be ABOVE the Pressable overlay, so it's inside the card) */}
          <Pressable onPress={onCancel} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <Text style={styles.title}>Oops..</Text>

          <Text style={styles.body}>
            You need an account to use{"\n"}
            this feature. Sign in or create{"\n"}
            one for free!
          </Text>

          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={[styles.button, styles.cancelBtn]} activeOpacity={0.85}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onSignIn} style={[styles.button, styles.signInBtn]} activeOpacity={0.85}>
              <Text style={styles.signInText}>Sign In</Text>
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
    backgroundColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
    justifyContent: "center",
    padding: sizes.l,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#F6CFCF",
    borderRadius: 16,
    paddingVertical: sizes.l,
    paddingHorizontal: sizes.l,
    borderWidth: 1,
    borderColor: "rgba(91,43,43,0.18)",
    ...shadows.small,

    // important so the X stays tappable and not clipped weirdly
    overflow: "visible",
  },
  closeBtn: {
    position: "absolute",
    right: 10,
    top: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    zIndex: 10,
    elevation: 10, // Android
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
    marginBottom: sizes.s,
  },
  body: {
    fontSize: 14,
    color: "#5B2B2B",
    opacity: 0.8,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: sizes.l,
  },
  actions: {
    flexDirection: "row",
    gap: sizes.s,
    justifyContent: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(91,43,43,0.25)",
  },
  cancelBtn: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5B2B2B",
    opacity: 0.9,
  },
  signInBtn: {
    backgroundColor: "rgba(255,255,255,0.75)",
  },
  signInText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#5B2B2B",
  },
});

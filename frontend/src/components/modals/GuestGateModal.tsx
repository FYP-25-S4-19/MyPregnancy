import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function GuestGateModal({ visible, onClose }: Props) {
  const router = useRouter();

  const goLogin = () => {
    onClose();
    router.push("/(intro)/login");
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Close */}
          <TouchableOpacity style={styles.close} onPress={onClose}>
            <Ionicons name="close" size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Content */}
          <Text style={styles.title}>Oops..</Text>

          <Text style={styles.message}>
            You need an account to use this feature.{"\n"}
            Sign in or create one for free!
          </Text>

          {/* Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnOutline]}
              onPress={onClose}
              activeOpacity={0.9}
            >
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.btnFilled]}
              onPress={goLogin}
              activeOpacity={0.9}
            >
              <Text style={styles.btnFilledText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.l,
  },

  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: colors.secondary,
    borderRadius: sizes.borderRadius,
    padding: sizes.l,
    ...shadows.small,
  },

  close: {
    position: "absolute",
    top: sizes.s,
    right: sizes.s,
    padding: sizes.s,
  },

  title: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "800",
    marginBottom: sizes.s,
  },

  message: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "500",
    lineHeight: font.xs + 8,
    marginBottom: sizes.l,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: sizes.s,
  },

  btn: {
    borderRadius: sizes.s,
    paddingVertical: sizes.s,
    paddingHorizontal: sizes.m,
    alignItems: "center",
    justifyContent: "center",
  },

  btnOutline: {
    backgroundColor: colors.white,
  },

  btnOutlineText: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "600",
  },

  btnFilled: {
    backgroundColor: colors.white,
  },

  btnFilledText: {
    color: colors.text,
    fontSize: font.xs,
    fontWeight: "800",
  },
});
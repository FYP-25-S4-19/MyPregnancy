import React from "react";
import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { colors, sizes, font, shadows } from "@/src/shared/designSystem";

const wallpaper = require("../../../assets/images/wallpaper.jpg");

export default function WhoAreYouJoiningAsScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={wallpaper} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        <View style={styles.titleBlock}>
          <Text style={styles.titleSmall}>my</Text>
          <Text style={styles.titleLarge}>Pregnancy</Text>
        </View>

        <Text style={styles.question}>Who are you joining as?</Text>

        <TouchableOpacity
          style={[styles.btn, styles.btnFilled]}
          onPress={() => router.push("/(intro)/register?role=mom")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnFilledText}>I'm a Mom-to-be</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnFilled]}
          onPress={() => router.push("/(intro)/register?role=merchant")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnFilledText}>I'm a Merchant</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnOutline]}
          onPress={() => router.push("/(intro)/register?role=specialist")}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>I'm a Specialist</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: sizes.xl,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: sizes.xl,
  },
  titleSmall: {
    color: colors.text,
    fontSize: font.m,
    fontWeight: "500",
    textTransform: "lowercase",
  },
  titleLarge: {
    color: colors.text,
    fontSize: font.xxl,
    fontWeight: "800",
    marginTop: sizes.xs,
  },
  question: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "600",
    marginBottom: sizes.l,
  },
  btn: {
    width: "88%",
    paddingVertical: sizes.m,
    borderRadius: sizes.xl - sizes.s,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: sizes.m,
  },
  btnFilled: {
    backgroundColor: colors.secondary,
    ...shadows.small,
  },
  btnFilledText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "700",
  },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  btnOutlineText: {
    color: colors.text,
    fontSize: font.s,
    fontWeight: "700",
  },
  adminLinkWrap: { marginTop: sizes.m },
  adminLink: { color: colors.text, fontSize: font.xs },
});

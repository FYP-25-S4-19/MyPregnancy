import React, { useRef, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Dimensions, StatusBar } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

type Slide = {
  id: string;
  titleTop: string;
  titleBottom: string;
  subtitle: string;
  image?: any;
};

const SLIDES: Slide[] = [
  {
    id: "track",
    titleTop: "TRACK BABY’S",
    titleBottom: "GROWTH",
    subtitle: "Week-by-week milestones & tips.",
    image: require("../../../assets/images/onboarding/track.png"),
  },
  {
    id: "plan",
    titleTop: "PLAN &",
    titleBottom: "PREPARE",
    subtitle: "Checklists, reminders, and due-date calendar.",
    image: require("../../../assets/images/onboarding/plan.png"),
  },
  {
    id: "consult",
    titleTop: "CONSULT A",
    titleBottom: "PROFESSIONAL",
    subtitle: "Chat/video with a volunteer specialist.",
    image: require("../../../assets/images/onboarding/consult.png"),
  },
];

export default function Onboarding() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const goPrev = useCallback(() => {
    if (index > 0) listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  }, [index]);

  const goNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    } else {
      // last slide → go to Register flow (choose role screen)
      router.push("/(intro)/whoAreYouJoiningAs");
    }
  }, [index, router]);

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.illustrationWrap}>
        {item.image && <Image source={item.image} style={styles.illustration} resizeMode="contain" />}
      </View>

      <Text style={styles.titleTop}>{item.titleTop}</Text>
      <Text style={styles.titleBottom}>{item.titleBottom}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" />

      {/* PAGER */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.id}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
      />

      {/* ARROWS + DOTS */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.arrow, index === 0 && styles.arrowDisabled]}
          onPress={goPrev}
          disabled={index === 0}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.arrow} onPress={goNext}>
          <Text style={styles.arrowText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* CTA ROW */}
      <View style={styles.cta}>
        <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => router.push("/(intro)/login")}>
          <Text style={styles.btnPrimaryText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.push("/(intro)/whoAreYouJoiningAs")}
        >
          <Text style={styles.btnSecondaryText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/main/guest")}>
          <Text style={styles.guest}>Continue as Guest →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const PINK = "#FADADD";
const MAROON = "#6d2828";
const LIGHT = "#FFF8F8";
const PAPER = "#FFF8F8";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  slide: { alignItems: "center", paddingTop: 56, paddingHorizontal: 24 },
  illustrationWrap: {
    height: 320,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: { width: "70%", height: "100%" },

  titleTop: { marginTop: 8, fontSize: 24, color: MAROON, letterSpacing: 1 },
  titleBottom: { fontSize: 36, color: MAROON, fontWeight: "700", marginTop: 4 },
  subtitle: { marginTop: 10, fontSize: 14, color: MAROON, opacity: 0.9 },

  controls: {
    marginTop: 8,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIGHT,
    borderWidth: 1.5,
    borderColor: PINK,
  },
  arrowDisabled: { opacity: 0.35 },
  arrowText: { fontSize: 20, color: MAROON },

  dots: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, marginHorizontal: 4, backgroundColor: "#e7c9cc" },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: MAROON },

  cta: { alignItems: "center", paddingHorizontal: 20, paddingBottom: 28, gap: 10 },
  btn: { width: "90%", paddingVertical: 14, borderRadius: 50, alignItems: "center" },
  btnPrimary: { backgroundColor: PINK },
  btnPrimaryText: { color: MAROON, fontSize: 16, fontWeight: "600" },
  btnSecondary: { backgroundColor: LIGHT, borderColor: PINK, borderWidth: 1.5 },
  btnSecondaryText: { color: MAROON, fontSize: 16, fontWeight: "600" },
  guest: { color: MAROON, fontSize: 13 },
});

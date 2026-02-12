import { View, Text, StyleSheet, FlatList, TouchableOpacity, ImageBackground, StatusBar } from "react-native";
import { useRef, useState, useCallback, useEffect } from "react";
import { colors, sizes, font } from "@/src/shared/designSystem";
import { useRouter } from "expo-router";
import api from "@/src/shared/api";
import { Image } from "expo-image";

/** ----- slide content ----- */
type Slide = {
  id: string;
  titleTop: string; // e.g., "Track Baby's"
  titleBottom?: string; // e.g., "Growth"
  subtitle: string;
  image: any; // require(...)
};

const SLIDES: Slide[] = [
  {
    id: "track",
    titleTop: "Track Baby's",
    titleBottom: "Growth",
    subtitle: "Week-by-week milestones & tips.",
    image: require("../../../assets/images/onboarding/track.png"),
  },
  {
    id: "plan",
    titleTop: "Plan &",
    titleBottom: "Prepare",
    subtitle: "Checklists, reminders, and due-date calendar.",
    image: require("../../../assets/images/onboarding/plan.png"),
  },
  {
    id: "consult",
    titleTop: "Consult a",
    titleBottom: "Professional",
    subtitle: "Chat/video with a volunteer specialist.",
    image: require("../../../assets/images/onboarding/consult.png"),
  },
];

const WALLPAPER = require("../../../assets/images/wallpaper.jpg");

/** ----- screen ----- */
export default function IntroPagerSinglePage() {
  const router = useRouter();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  // keep your original ping
  // useEffect(() => {
  //   try {
  //     console.log("BaseURI:", api.getUri());
  //     api.get("/").then((res) => console.log("Ping:", res.data));
  //   } catch {}
  // }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const i = viewableItems?.[0]?.index;
    if (typeof i === "number") setIndex(i);
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 }).current;

  const goPrev = useCallback(() => {
    if (index > 0) listRef.current?.scrollToIndex({ index: index - 1, animated: true });
  }, [index]);

  const goNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
    }
  }, [index]);

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: sizes.screenWidth }]}>
      {/* Title block (matches Figma proportions) */}
      <View style={styles.titleBlock}>
        <Text style={styles.titleTop}>{item.titleTop}</Text>
        {!!item.titleBottom && <Text style={styles.titleBottom}>{item.titleBottom}</Text>}
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>

      {/* Illustration with floating arrows close to it */}
      <View style={styles.heroArea}>
        <TouchableOpacity
          style={[styles.arrowCircle, index === 0 && styles.arrowDisabled]}
          onPress={goPrev}
          disabled={index === 0}
        >
          <Text style={styles.arrowText}>←</Text>
        </TouchableOpacity>

        <View style={styles.illustrationWrap}>
          {/* Note: if your PNG contains big whitespace, it will still look smaller.
             Re-export selection-only artwork to fix that perfectly. */}
          <Image source={item.image} style={styles.illustration} />
        </View>

        <TouchableOpacity
          style={[styles.arrowCircle, index === SLIDES.length - 1 && styles.arrowDisabled]}
          onPress={goNext}
          disabled={index === SLIDES.length - 1}
        >
          <Text style={styles.arrowText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ImageBackground source={WALLPAPER} style={styles.bg} resizeMode="cover">
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        {/* Pager */}
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
          getItemLayout={(_, i) => ({ length: sizes.screenWidth, offset: sizes.screenWidth * i, index: i })}
        />

        {/* Dots just above CTAs */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.cta}>
          <TouchableOpacity style={[styles.btn, styles.btnFilled]} onPress={() => router.push("/(intro)/login")}>
            <Text style={styles.btnFilledText}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={() => router.push("/(intro)/whoAreYouJoiningAs")}
          >
            <Text style={styles.btnOutlineText}>Register</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/main/guest")}>
            <Text style={styles.guest}>Continue as Guest →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
}

/** ----- styles ----- */
const styles = StyleSheet.create({
  bg: { flex: 1 },
  screen: { flex: 1, justifyContent: "flex-start" },

  /* Slide area */
  slide: {
    paddingTop: sizes.screenHeight * 0.06, // more top spacing like Figma
    paddingHorizontal: sizes.m,
  },

  titleBlock: {
    alignItems: "center",
    justifyContent: "center",
  },
  titleTop: {
    fontSize: font.l,
    color: colors.text,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  titleBottom: {
    fontSize: font.xxl + 6,
    fontWeight: "800",
    color: colors.text,
    textTransform: "uppercase",
    marginTop: sizes.xs / 2,
  },
  subtitle: {
    marginTop: sizes.s,
    fontSize: font.xxs + 1,
    color: colors.text,
    opacity: 0.9,
    textAlign: "center",
  },

  /* Illustration row with arrows hugging the image */
  heroArea: {
    marginTop: sizes.s + sizes.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: sizes.s + sizes.xs,
  },
  illustrationWrap: {
    width: sizes.screenWidth * 0.68, // bigger hero like Figma
    height: Math.min(380, sizes.screenHeight * 0.42),
    alignItems: "center",
    justifyContent: "center",
  },
  illustration: {
    width: "100%",
    height: "100%",
  },
  arrowCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowDisabled: { opacity: 0.35 },
  arrowText: { fontSize: font.m, color: colors.text, lineHeight: 20 },

  /* Dots & CTAs */
  dotsRow: {
    marginTop: sizes.s + sizes.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: sizes.s,
  },
  dot: {
    width: sizes.s,
    height: sizes.s,
    borderRadius: sizes.s / 2,
    backgroundColor: colors.lightGray,
  },
  dotActive: {
    width: sizes.s + sizes.xs,
    height: sizes.s + sizes.xs,
    borderRadius: (sizes.s + sizes.xs) / 2,
    backgroundColor: colors.text,
  },

  cta: {
    alignItems: "center",
    paddingHorizontal: sizes.m,
    paddingBottom: sizes.xl - sizes.s,
    marginTop: sizes.m,
    marginBottom: sizes.xl,
    gap: sizes.m - sizes.xs,
  },
  btn: {
    width: "88%",
    paddingVertical: sizes.m,
    borderRadius: sizes.xl - sizes.s,
    alignItems: "center",
    justifyContent: "center",
  },
  btnFilled: { backgroundColor: colors.secondary },
  btnFilledText: { color: colors.text, fontSize: font.s, fontWeight: "700" },
  btnOutline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  btnOutlineText: { color: colors.text, fontSize: font.s, fontWeight: "700" },
  guest: { color: colors.text, fontSize: font.xxs + 1, marginTop: sizes.xs / 2 },
});

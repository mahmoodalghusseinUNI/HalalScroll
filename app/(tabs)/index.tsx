import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const WAIT_SECONDS = 3;

type AppItem = {
  name: string;
  browserName: string;
  subtitle: string;
  url: string;
  type: "app" | "settings";
};

type QuranVerse = {
  surah: string;
  verse: string;
  text: string;
};

const apps: AppItem[] = [
  {
    name: "Instagram",
    browserName: "Insta",
    subtitle: "No Reels",
    url: "https://www.instagram.com",
    type: "app",
  },
  {
    name: "TikTok",
    browserName: "TikTok",
    subtitle: "No TikToks",
    url: "https://www.tiktok.com",
    type: "app",
  },
  {
    name: "YouTube",
    browserName: "YouTube",
    subtitle: "No Shorts",
    url: "https://www.youtube.com",
    type: "app",
  },
  {
    name: "Settings",
    browserName: "Settings",
    subtitle: "Legal & App Info",
    url: "",
    type: "settings",
  },
];

const quranVerses: QuranVerse[] = [
  {
    surah: "Al-Baqarah",
    verse: "2:286",
    text: "Allah does not burden a soul beyond what it can bear.",
  },
  {
    surah: "Ash-Sharh",
    verse: "94:5-6",
    text: "Surely with hardship comes ease. Surely with that hardship comes more ease.",
  },
  {
    surah: "Ar-Ra'd",
    verse: "13:28",
    text: "Truly, in the remembrance of Allah do hearts find peace.",
  },
  {
    surah: "At-Talaq",
    verse: "65:3",
    text: "Whoever puts their trust in Allah, then He alone is sufficient for them.",
  },
  {
    surah: "Ad-Duha",
    verse: "93:7",
    text: "He found you lost and guided you.",
  },
  {
    surah: "Az-Zumar",
    verse: "39:53",
    text: "Do not lose hope in the mercy of Allah.",
  },
  {
    surah: "Al-Ankabut",
    verse: "29:69",
    text: "Those who strive for Our sake, We will surely guide them to Our ways.",
  },
  {
    surah: "Ibrahim",
    verse: "14:7",
    text: "If you are grateful, I will certainly give you more.",
  },
  {
    surah: "Al-Mulk",
    verse: "67:2",
    text: "He created death and life to test which of you is best in deeds.",
  },
  {
    surah: "Al-Asr",
    verse: "103:1-3",
    text: "Humanity is in loss, except those who believe, do good, and encourage truth and patience.",
  },
];

function openApp(item: AppItem) {
  if (item.name === "TikTok") {
    router.push("/tiktok" as any);
    return;
  }

  router.push({
    pathname: "/browser" as any,
    params: {
      url: item.url,
      appName: item.browserName,
    },
  });
}

function AppButton({
  item,
  onPress,
}: {
  item: AppItem;
  onPress: (item: AppItem) => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(item)}
      style={styles.appCard}
    >
      <View style={styles.appTextBox}>
        <Text allowFontScaling={false} style={styles.appTitle}>
          {item.name}
        </Text>

        <Text allowFontScaling={false} style={styles.appSubtitle}>
          {item.subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Index() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [pendingApp, setPendingApp] = useState<AppItem | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(WAIT_SECONDS);
  const [selectedVerse, setSelectedVerse] = useState<QuranVerse>(
    quranVerses[0],
  );

  const hasOpenedRef = useRef(false);

  const frameWidth = Math.min(width * 0.92, 430);
  const frameHeight = Math.min(
    height - insets.top - insets.bottom - 12,
    Platform.OS === "android" ? height * 0.97 : height * 0.94,
  );

  useEffect(() => {
    if (!pendingApp) return;

    if (secondsLeft <= 0 && !hasOpenedRef.current) {
      hasOpenedRef.current = true;

      setTimeout(() => {
        openApp(pendingApp);
        setPendingApp(null);
        setSecondsLeft(WAIT_SECONDS);
      }, 0);
    }
  }, [secondsLeft, pendingApp]);

  useEffect(() => {
    if (!pendingApp) return;
    if (secondsLeft <= 0) return;

    const timeout = setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => clearTimeout(timeout);
  }, [pendingApp, secondsLeft]);

  const startWaiting = (item: AppItem) => {
    if (item.type === "settings") {
      router.push("/settings" as any);
      return;
    }

    const randomVerse =
      quranVerses[Math.floor(Math.random() * quranVerses.length)];

    hasOpenedRef.current = false;
    setSelectedVerse(randomVerse);
    setSecondsLeft(WAIT_SECONDS);
    setPendingApp(item);
  };

  return (
    <SafeAreaView
      style={styles.outer}
      edges={["top", "bottom", "left", "right"]}
    >
      <LinearGradient
        colors={["#FFE982", "#FFC928", "#FFC21F"]}
        style={StyleSheet.absoluteFill}
      />

      <View
        style={[
          styles.phoneFrame,
          {
            width: frameWidth,
            height: frameHeight,
            paddingTop: Math.max(28, Math.min(44, height * 0.045)),
          },
        ]}
      >
        <View style={styles.nav}>
          <Text allowFontScaling={false} style={styles.pageTitle}>
            HALAL SCROLL
          </Text>
        </View>

        {pendingApp ? (
          <View style={styles.waitContent}>
            <View style={styles.timerCircle}>
              <Text allowFontScaling={false} style={styles.timerNumber}>
                {secondsLeft}
              </Text>

              <Text allowFontScaling={false} style={styles.timerLabel}>
                seconds
              </Text>
            </View>

            <View style={styles.verseCard}>
              <Text allowFontScaling={false} style={styles.waitTitle}>
                Pause before you scroll
              </Text>

              <Text style={styles.verseText}>“{selectedVerse.text}”</Text>

              <Text allowFontScaling={false} style={styles.verseSource}>
                Surah {selectedVerse.surah} • {selectedVerse.verse}
              </Text>
            </View>

            <Text allowFontScaling={false} style={styles.openingText}>
              Opening {pendingApp.name}...
            </Text>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <View style={styles.list}>
              {apps.map((item) => (
                <AppButton key={item.name} item={item} onPress={startWaiting} />
              ))}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFC928",
  },

  phoneFrame: {
    borderRadius: 36,
    paddingHorizontal: 18,
    overflow: "hidden",
    alignSelf: "center",
  },

  nav: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 35,
  },

  pageTitle: {
    color: "#222",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
    width: "100%",
  },

  list: {
    gap: 16,
    width: "100%",
  },

  appCard: {
    width: "100%",
    minHeight: 90,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  appTextBox: {
    alignItems: "center",
    maxWidth: "100%",
  },

  appTitle: {
    color: "#222",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
    textAlign: "center",
  },

  appSubtitle: {
    color: "#222",
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center",
  },

  waitContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingBottom: 20,
  },

  timerCircle: {
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  timerNumber: {
    color: "#222",
    fontSize: 42,
    fontWeight: "900",
    lineHeight: 46,
  },

  timerLabel: {
    color: "#222",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  verseCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#222",
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  waitTitle: {
    color: "#222",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 14,
    textAlign: "center",
  },

  verseText: {
    color: "#222",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 27,
    textAlign: "center",
    marginBottom: 14,
  },

  verseSource: {
    color: "#222",
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    opacity: 0.8,
  },

  openingText: {
    color: "#222",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 18,
    textAlign: "center",
  },
});

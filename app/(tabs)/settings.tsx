import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

type LegalType = "impressum" | "privacy" | "terms";

type LegalItem = {
  title: string;
  subtitle: string;
  type: LegalType;
};

const legalItems: LegalItem[] = [
  {
    title: "Legal Notice",
    subtitle: "Impressum",
    type: "impressum",
  },
  {
    title: "Privacy Policy",
    subtitle: "Datenschutzerklärung",
    type: "privacy",
  },
  {
    title: "Terms of Use",
    subtitle: "Nutzungsbedingungen",
    type: "terms",
  },
];

export default function SettingsScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const frameWidth = Math.min(width * 0.92, 430);
  const frameHeight = Math.min(
    height - insets.top - insets.bottom - 12,
    Platform.OS === "android" ? height * 0.97 : height * 0.94,
  );

  const openLegalPage = (type: LegalType) => {
    router.push({
      pathname: "/legal" as any,
      params: {
        type,
      },
    });
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
          <Pressable onPress={() => router.replace("/" as any)}>
            <Text allowFontScaling={false} style={styles.backText}>
              Back
            </Text>
          </Pressable>

          <Text allowFontScaling={false} style={styles.pageTitle}>
            SETTINGS
          </Text>

          <View style={styles.navSpacer} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text allowFontScaling={false} style={styles.sectionTitle}>
              Legal
            </Text>

            {legalItems.map((item) => (
              <Pressable
                key={item.type}
                onPress={() => openLegalPage(item.type)}
                style={styles.legalCard}
              >
                <View style={styles.legalTextBox}>
                  <Text allowFontScaling={false} style={styles.legalTitle}>
                    {item.title}
                  </Text>

                  <Text allowFontScaling={false} style={styles.legalSubtitle}>
                    {item.subtitle}
                  </Text>
                </View>

                <Text allowFontScaling={false} style={styles.arrow}>
                  ›
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
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
    width: "100%",
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  backText: {
    color: "#222",
    fontSize: 14,
    fontWeight: "900",
  },

  pageTitle: {
    color: "#222",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 1,
    textAlign: "center",
  },

  navSpacer: {
    width: 38,
  },

  scroll: {
    flex: 1,
    width: "100%",
  },

  scrollContent: {
    paddingBottom: 28,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    color: "#222",
    fontSize: 13,
    fontWeight: "900",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
  },

  legalCard: {
    width: "100%",
    minHeight: 74,
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#222",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  legalTextBox: {
    flex: 1,
    minWidth: 0,
  },

  legalTitle: {
    color: "#222",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 3,
  },

  legalSubtitle: {
    color: "#222",
    fontSize: 11,
    fontWeight: "800",
    opacity: 0.8,
  },

  arrow: {
    color: "#222",
    fontSize: 34,
    fontWeight: "700",
    marginLeft: 12,
  },
});

import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type LegalType = "impressum" | "privacy" | "terms";

type LegalContent = {
  title: string;
  subtitle: string;
  body: string[];
};

const content: Record<LegalType, LegalContent> = {
  impressum: {
    title: "Legal Notice",
    subtitle: "Impressum",
    body: [
      "App name: Halal Scroll",
      "Responsible person / company: [Add your full name or company name]",
      "Address: [Add your business address]",
      "Email: [Add your contact email]",
      "Phone: [Optional: add phone number]",
      "VAT ID: [Optional: add VAT ID if you have one]",
      "This legal notice is a placeholder. Replace it with your real legal information before publishing the app.",
    ],
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "Datenschutzerklärung",
    body: [
      "This app is designed to open selected social media websites inside a limited browser experience.",
      "We do not intentionally collect, sell, or share personal data through this app.",
      "Social media services opened inside the app, such as Instagram, TikTok, and YouTube, may collect data according to their own privacy policies.",
      "Local app settings, such as Gray Mode, may be saved on your device so the app remembers your preference.",
      "If you contact us, we may process your contact details only to answer your request.",
      "Contact: [Add your privacy contact email]",
      "This privacy policy is a placeholder. Replace it with a lawyer-checked version before publishing.",
    ],
  },
  terms: {
    title: "Terms of Use",
    subtitle: "Nutzungsbedingungen",
    body: [
      "By using Halal Scroll, you agree to use the app responsibly and legally.",
      "The app is provided to support more mindful social media use. It does not guarantee complete blocking of all unwanted content.",
      "Instagram, TikTok, and YouTube are third-party services. We are not responsible for their content, availability, or policies.",
      "You may not misuse the app, reverse engineer it, or use it for illegal purposes.",
      "We may update these terms when the app changes.",
      "Contact: [Add your contact email]",
      "These terms are a placeholder. Replace them with a lawyer-checked version before publishing.",
    ],
  },
};

export default function Legal() {
  const params = useLocalSearchParams<{ type?: string }>();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const type =
    params.type === "privacy" || params.type === "terms" || params.type === "impressum"
      ? (params.type as LegalType)
      : "impressum";

  const page = content[type];

  const frameWidth = Math.min(width * 0.92, 430);
  const frameHeight = Math.min(
    height - insets.top - insets.bottom - 12,
    Platform.OS === "android" ? height * 0.97 : height * 0.94,
  );

  return (
    <SafeAreaView style={styles.outer} edges={["top", "bottom", "left", "right"]}>
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
            paddingTop: Math.max(24, Math.min(38, height * 0.04)),
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.back()} style={styles.backButton}>
            <Text allowFontScaling={false} style={styles.backText}>‹</Text>
          </TouchableOpacity>

          <View style={styles.titleBox}>
            <Text allowFontScaling={false} style={styles.pageTitle}>{page.title}</Text>
            <Text allowFontScaling={false} style={styles.pageSubtitle}>{page.subtitle}</Text>
          </View>

          <View style={styles.backButtonPlaceholder} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.legalContentCard}>
            {page.body.map((paragraph, index) => (
              <Text key={`${type}-${index}`} style={styles.paragraph}>
                {paragraph}
              </Text>
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

  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: "#222",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 2, height: 3 },
    elevation: 4,
  },

  backText: {
    color: "#222",
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 36,
    marginTop: -2,
  },

  backButtonPlaceholder: {
    width: 42,
    height: 42,
  },

  titleBox: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },

  pageTitle: {
    color: "#222",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
    textAlign: "center",
  },

  pageSubtitle: {
    color: "#222",
    fontSize: 10,
    fontWeight: "800",
    opacity: 0.75,
    marginTop: 3,
    textAlign: "center",
  },

  scrollContent: {
    paddingBottom: 34,
  },

  legalContentCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#222",
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  paragraph: {
    color: "#222",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
    marginBottom: 16,
  },
});

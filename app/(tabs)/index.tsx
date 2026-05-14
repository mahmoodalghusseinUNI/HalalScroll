import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import HalalScreenTime from "../../modules/halal-screen-time";

const { width } = Dimensions.get("window");

const apps = [
  {
    name: "Instagram",
    subtitle: "No Reels",
    url: "https://www.instagram.com",
  },
  {
    name: "TikTok",
    subtitle: "No TikToks",
    url: "https://www.tiktok.com",
  },
  {
    name: "YouTube",
    subtitle: "No Shorts",
    url: "https://www.youtube.com",
  },
];

function AppButton({ item }: any) {
  const openApp = () => {
    router.push({
      pathname: "/browser" as any,
      params: { url: item.url },
    });
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={openApp}
      style={styles.appCard}
    >
      <View style={styles.appTextBox}>
        <Text style={styles.appTitle}>{item.name}</Text>
        <Text style={styles.appSubtitle}>{item.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function Index() {
  const [enabled, setEnabled] = useState(false);
  const [loadingMode, setLoadingMode] = useState(false);

  useEffect(() => {
    const loadHalalMode = async () => {
      const saved = await AsyncStorage.getItem("halalModeEnabled");
      const isEnabled = saved === "true";

      setEnabled(isEnabled);

      if (Platform.OS === "ios" && isEnabled) {
        try {
          HalalScreenTime.enableBlocking();
        } catch {
          setEnabled(false);
          await AsyncStorage.setItem("halalModeEnabled", "false");
        }
      }
    };

    loadHalalMode();
  }, []);

  const toggleHalalMode = async (value: boolean) => {
    if (loadingMode) return;

    setLoadingMode(true);

    try {
      if (Platform.OS !== "ios") {
        setEnabled(value);
        await AsyncStorage.setItem("halalModeEnabled", String(value));
        setLoadingMode(false);
        return;
      }

      const approved = await HalalScreenTime.requestAuthorization();

      if (!approved) {
        alert("Screen Time permission is required.");
        setEnabled(false);
        await AsyncStorage.setItem("halalModeEnabled", "false");
        setLoadingMode(false);
        return;
      }

      if (value) {
        const hasSelection = HalalScreenTime.hasSelection();

        if (!hasSelection) {
          alert("First choose the apps you want to block.");
          HalalScreenTime.showPicker();
          setEnabled(false);
          await AsyncStorage.setItem("halalModeEnabled", "false");
          setLoadingMode(false);
          return;
        }

        const success = HalalScreenTime.enableBlocking();

        if (!success) {
          alert("Could not enable blocking. Please choose apps again.");
          HalalScreenTime.showPicker();
          setEnabled(false);
          await AsyncStorage.setItem("halalModeEnabled", "false");
          setLoadingMode(false);
          return;
        }
      } else {
        HalalScreenTime.disableBlocking();
      }

      setEnabled(value);
      await AsyncStorage.setItem("halalModeEnabled", String(value));
    } catch {
      alert("Halal Mode could not be changed. This needs a native iOS build.");
      setEnabled(false);
      await AsyncStorage.setItem("halalModeEnabled", "false");
    }

    setLoadingMode(false);
  };

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={["#FFE982", "#FFC928", "#FFC21F"]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.phoneFrame}>
        <View style={styles.nav}>
          <Text style={styles.pageTitle}>HALAL SCROLL</Text>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.modeBox}>
            <Text style={styles.modeText}>
              {enabled ? "Halal Mode On" : "Halal Mode Off"}
            </Text>

            <View style={styles.switchWrapper}>
              <Switch
                value={enabled}
                disabled={loadingMode}
                onValueChange={toggleHalalMode}
                trackColor={{
                  false: "#444",
                  true: "#34C759",
                }}
                thumbColor="#fff"
                ios_backgroundColor="#444"
                style={styles.smallSwitch}
              />
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          >
            {apps.map((item) => (
              <AppButton key={item.name} item={item} />
            ))}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  phoneFrame: {
    width: width * 0.92,
    height: "94%",
    borderRadius: 36,
    paddingHorizontal: 18,
    paddingTop: 40,
    overflow: "hidden",
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
  },

  centerContent: {
    flex: 1,
    justifyContent: "center",
  },

  modeBox: {
    alignSelf: "center",
    height: 46,
    paddingLeft: 16,
    paddingRight: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 2,
    borderColor: "#222",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    marginBottom: 24,
  },

  modeText: {
    color: "#222",
    fontSize: 12,
    fontWeight: "900",
  },

  switchWrapper: {
    width: 38,
    height: 26,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -2,
  },

  smallSwitch: {
    transform: [{ scaleX: 0.62 }, { scaleY: 0.62 }],
  },

  list: {
    paddingBottom: 40,
    gap: 16,
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
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 4 },
    elevation: 5,
  },

  appTextBox: {
    alignItems: "center",
  },

  appTitle: {
    color: "#222",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },

  appSubtitle: {
    color: "#222",
    fontSize: 10,
    fontWeight: "800",
  },
});

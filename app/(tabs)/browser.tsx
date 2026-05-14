import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { WebView } from "react-native-webview";

export default function Browser() {
  const { url } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const safeUrl = Array.isArray(url) ? url[0] : url;
  const initialUrl = safeUrl || "https://www.instagram.com";

  const isInitialYouTube =
    typeof initialUrl === "string" &&
    (initialUrl.includes("youtube.com") || initialUrl.includes("youtu.be"));

  const isInitialYouTubeHome =
    typeof initialUrl === "string" &&
    (initialUrl === "https://m.youtube.com" ||
      initialUrl === "https://m.youtube.com/" ||
      initialUrl === "https://www.youtube.com" ||
      initialUrl === "https://www.youtube.com/" ||
      initialUrl.includes("youtube.com/?") ||
      initialUrl.endsWith("youtube.com"));

  const [isYouTubePage, setIsYouTubePage] = useState(isInitialYouTube);
  const [isYouTubeHomePage, setIsYouTubeHomePage] =
    useState(isInitialYouTubeHome);
  const [isYouTubeSwitching, setIsYouTubeSwitching] = useState(false);
  const [isYouTubeWatchPage, setIsYouTubeWatchPage] = useState(false);
  const [canWebViewGoBack, setCanWebViewGoBack] = useState(false);
  const [lastYouTubeResultsUrl, setLastYouTubeResultsUrl] = useState<
    string | null
  >(null);
  const [youtubeSearch, setYoutubeSearch] = useState("");
  const [youtubeSuggestions, setYoutubeSuggestions] = useState<string[]>([]);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  const bottomBarHeight = Platform.OS === "android" ? 96 : 56;

  const barBackground =
    Platform.OS === "android" ? "#ffffff" : isDarkMode ? "#0f0f0f" : "#ffffff";

  const barBorder =
    Platform.OS === "android" ? "#e5e5e5" : isDarkMode ? "#2a2a2a" : "#e5e5e5";

  const activeColor =
    Platform.OS === "android" ? "#0f0f0f" : isDarkMode ? "#ffffff" : "#0f0f0f";

  const inactiveColor =
    Platform.OS === "android" ? "#606060" : isDarkMode ? "#aaaaaa" : "#606060";

  const returnButtonBackground = isDarkMode
    ? "rgba(20, 20, 20, 0.92)"
    : "rgba(255, 255, 255, 0.92)";

  const returnButtonColor = isDarkMode ? "#ffffff" : "#0f0f0f";

  const youtubeOverlayBackground = isDarkMode ? "#000000" : "#ffffff";
  const youtubeCardBackground = isDarkMode ? "#111111" : "#f4f4f4";
  const youtubeCardBorder = isDarkMode
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.08)";
  const youtubeSearchBackground = isDarkMode ? "#181818" : "#f1f1f1";
  const youtubeSearchBorder = isDarkMode
    ? "rgba(255,255,255,0.12)"
    : "rgba(0,0,0,0.08)";
  const youtubeTitleColor = isDarkMode ? "#ffffff" : "#0f0f0f";
  const youtubeSubtitleColor = isDarkMode ? "#aaaaaa" : "#606060";
  const youtubePlaceholderColor = isDarkMode ? "#777777" : "#777777";
  const youtubeInputColor = isDarkMode ? "#ffffff" : "#0f0f0f";
  const youtubeIconCircleBackground = isDarkMode
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.06)";
  const youtubeSuggestionBoxBackground = isDarkMode ? "#181818" : "#f7f7f7";
  const youtubeSuggestionBorder = isDarkMode
    ? "rgba(255,255,255,0.1)"
    : "rgba(0,0,0,0.08)";
  const youtubeSuggestionTextColor = isDarkMode ? "#ffffff" : "#0f0f0f";

  useEffect(() => {
    const query = youtubeSearch.trim();

    if (!isYouTubeHomePage || query.length < 2) {
      setYoutubeSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
            query,
          )}`,
        );

        const data = await response.json();

        if (Array.isArray(data) && Array.isArray(data[1])) {
          setYoutubeSuggestions(data[1].slice(0, 6));
        } else {
          setYoutubeSuggestions([]);
        }
      } catch {
        setYoutubeSuggestions([]);
      }
    }, 180);

    return () => clearTimeout(timeout);
  }, [youtubeSearch, isYouTubeHomePage]);

  const isBlockedYouTubeShortsUrl = (targetUrl: string) => {
    const lowerUrl = targetUrl.toLowerCase();

    const isYouTube =
      lowerUrl.includes("youtube.com") || lowerUrl.includes("youtu.be");

    if (!isYouTube) return false;

    return (
      lowerUrl.includes("/shorts") ||
      lowerUrl.includes("youtube.com/shorts") ||
      lowerUrl.includes("m.youtube.com/shorts")
    );
  };

  const blockYouTubeShorts = () => {
    setIsYouTubePage(true);
    setIsYouTubeHomePage(true);
    setIsYouTubeSwitching(false);
    setIsYouTubeWatchPage(false);

    webViewRef.current?.injectJavaScript(`
      window.location.replace('https://m.youtube.com/');
      true;
    `);

    reinjectHalalScript();
  };

  const checkYouTubeState = (currentUrl: string) => {
    const isYT =
      currentUrl.includes("youtube.com") || currentUrl.includes("youtu.be");

    const cleanUrl = currentUrl.split("#")[0];
    const withoutQuery = cleanUrl.split("?")[0];

    const isHome =
      withoutQuery === "https://m.youtube.com" ||
      withoutQuery === "https://m.youtube.com/" ||
      withoutQuery === "https://www.youtube.com" ||
      withoutQuery === "https://www.youtube.com/" ||
      withoutQuery === "http://m.youtube.com" ||
      withoutQuery === "http://m.youtube.com/" ||
      withoutQuery === "http://www.youtube.com" ||
      withoutQuery === "http://www.youtube.com/";

    const isWatch =
      isYT &&
      (currentUrl.includes("youtube.com/watch") ||
        currentUrl.includes("m.youtube.com/watch") ||
        currentUrl.includes("youtu.be/"));

    setIsYouTubePage(isYT);
    setIsYouTubeWatchPage(isWatch);

    if (isYouTubeSwitching) {
      setIsYouTubeHomePage(false);
      return;
    }

    setIsYouTubeHomePage(isYT && isHome);
  };

  const halalScript = `
    (function() {
      function injectCSS() {
        if (document.getElementById("halal-clean-css")) return;

        const style = document.createElement("style");
        style.id = "halal-clean-css";

        style.innerHTML = \`
          html, body {
            background: #000 !important;
          }

          ytm-pivot-bar-renderer,
          ytm-bottom-navigation-renderer,
          ytm-mobile-topbar-renderer + ytm-pivot-bar-renderer,
          tp-yt-app-drawer,
          ytm-app ytm-pivot-bar-renderer,
          ytm-watch ytm-pivot-bar-renderer,
          ytm-search ytm-pivot-bar-renderer,
          ytm-browse ytm-pivot-bar-renderer,
          .bottom-bar,
          .pivot-bar,
          [role="tablist"],
          a[href="/shorts"],
          a[href^="/shorts"],
          a[href*="/shorts/"],
          a[href^="https://www.youtube.com/shorts"],
          a[href^="https://m.youtube.com/shorts"],
          a[href="/subscriptions"],
          a[href="/feed/you"],
          a[href="/feed/library"],
          a[href="/feed/history"],
          a[href="/feed/subscriptions"],
          ytm-reel-shelf-renderer,
          ytd-reel-shelf-renderer,
          ytm-shorts-lockup-view-model,
          ytd-shorts,
          ytd-reel-video-renderer,
          ytm-rich-shelf-renderer,
          ytd-rich-shelf-renderer,
          reel-shelf-renderer,
          [title="Shorts"],
          [aria-label="Shorts"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            max-height: 0 !important;
            min-height: 0 !important;
            pointer-events: none !important;
            overflow: hidden !important;
            transform: translateY(200px) !important;
          }

          ytm-app,
          ytm-watch,
          ytm-browse,
          ytm-search {
            padding-bottom: 0 !important;
            margin-bottom: 0 !important;
          }

          a[href="/reels/"],
          a[href^="/reels/"],
          a[href^="/reel/"],
          a[aria-label="Reels"],
          svg[aria-label="Reels"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }

          body.halal-instagram-profile-page a[href$="/"],
          body.halal-instagram-profile-page a[href$="/tagged/"],
          body.halal-instagram-profile-page a[href$="/channel/"],
          body.halal-instagram-profile-page a[href*="/tagged"],
          body.halal-instagram-profile-page [role="tab"],
          body.halal-instagram-profile-page [role="tablist"] {
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            height: auto !important;
            max-height: none !important;
            min-height: unset !important;
            pointer-events: auto !important;
            transform: none !important;
          }

          body.halal-instagram-profile-page a[href*="/reels/"],
          body.halal-instagram-profile-page a[href$="/reels/"],
          body.halal-instagram-profile-page a[aria-label="Reels"],
          body.halal-instagram-profile-page svg[aria-label="Reels"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
          }

          body.halal-instagram-explore-clean {
            background: #000 !important;
            overflow: hidden !important;
            touch-action: none !important;
          }

          body.halal-instagram-explore-clean main article,
          body.halal-instagram-explore-clean main video,
          body.halal-instagram-explore-clean main img,
          body.halal-instagram-explore-clean main a[href^="/p/"],
          body.halal-instagram-explore-clean main a[href^="/reel/"],
          body.halal-instagram-explore-clean main a[href^="/reels/"],
          body.halal-instagram-explore-clean main div[role="button"]:has(video),
          body.halal-instagram-explore-clean main div[role="button"]:has(img) {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            height: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
          }

          body.halal-instagram-explore-clean svg[aria-label="Loading..."],
          body.halal-instagram-explore-clean svg[aria-label="Laden..."],
          body.halal-instagram-explore-clean [aria-label="Loading..."],
          body.halal-instagram-explore-clean [aria-label="Laden..."],
          body.halal-instagram-explore-clean [role="progressbar"],
          body.halal-instagram-explore-clean div[style*="animation"],
          body.halal-instagram-explore-clean div[style*="transform: rotate"],
          body.halal-instagram-explore-clean div[style*="rotate("],
          body.halal-instagram-explore-clean ._ab8w,
          body.halal-instagram-explore-clean ._ab8x,
          body.halal-instagram-explore-clean ._ab8y,
          body.halal-instagram-explore-clean ._ab8z {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            animation: none !important;
            pointer-events: none !important;
            height: 0 !important;
            width: 0 !important;
            max-height: 0 !important;
            max-width: 0 !important;
            overflow: hidden !important;
          }

          body.halal-instagram-explore-clean input,
          body.halal-instagram-explore-clean input[type="text"],
          body.halal-instagram-explore-clean input[placeholder],
          body.halal-instagram-explore-clean input[aria-label],
          body.halal-instagram-explore-clean [role="search"],
          body.halal-instagram-explore-clean form {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            touch-action: manipulation !important;
          }

          body.halal-dm-reel-block,
          body.halal-dm-reel-block * {
            overscroll-behavior: none !important;
            scroll-behavior: auto !important;
          }

          body.halal-dm-reel-block {
            overflow: hidden !important;
            touch-action: none !important;
          }

          body.halal-dm-reel-block [aria-label="Back"],
          body.halal-dm-reel-block [aria-label="Close"],
          body.halal-dm-reel-block [aria-label*="Audio"],
          body.halal-dm-reel-block [aria-label*="audio"],
          body.halal-dm-reel-block [aria-label*="Sound"],
          body.halal-dm-reel-block [aria-label*="sound"],
          body.halal-dm-reel-block button {
            pointer-events: auto !important;
            touch-action: manipulation !important;
            z-index: 2147483647 !important;
          }

          body.halal-youtube-home-block {
            background: #000 !important;
            overflow: hidden !important;
            touch-action: none !important;
          }

          body.halal-youtube-home-block ytm-browse,
          body.halal-youtube-home-block ytm-rich-grid-renderer,
          body.halal-youtube-home-block ytm-section-list-renderer,
          body.halal-youtube-home-block ytm-item-section-renderer,
          body.halal-youtube-home-block ytm-video-with-context-renderer,
          body.halal-youtube-home-block ytm-rich-item-renderer,
          body.halal-youtube-home-block ytm-compact-video-renderer,
          body.halal-youtube-home-block ytm-reel-shelf-renderer,
          body.halal-youtube-home-block ytm-shorts-lockup-view-model,
          body.halal-youtube-home-block ytm-shelf-renderer,
          body.halal-youtube-home-block ytm-feed-filter-chip-bar-renderer,
          body.halal-youtube-home-block ytm-chip-cloud-renderer,
          body.halal-youtube-home-block ytd-rich-grid-renderer,
          body.halal-youtube-home-block ytd-rich-item-renderer,
          body.halal-youtube-home-block ytd-video-renderer,
          body.halal-youtube-home-block ytd-reel-shelf-renderer {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        \`;

        document.documentElement.appendChild(style);
      }

      function isAllowedControl(target) {
        if (!target) return false;

        return !!target.closest(
          '[aria-label="Back"], ' +
          '[aria-label="Close"], ' +
          '[aria-label*="Audio"], ' +
          '[aria-label*="audio"], ' +
          '[aria-label*="Sound"], ' +
          '[aria-label*="sound"], ' +
          'button'
        );
      }

      function isYouTube() {
        return (
          location.hostname.includes("youtube.com") ||
          location.hostname.includes("youtu.be")
        );
      }

      function isYouTubeHome() {
        if (!isYouTube()) return false;

        return (
          location.pathname === "/" ||
          location.pathname === "" ||
          location.pathname === "/index"
        );
      }

      function parseDurationToSeconds(text) {
        if (!text) return null;

        const matches = text.match(/\\b\\d{1,2}:\\d{2}(?::\\d{2})?\\b/g);

        if (!matches || matches.length === 0) return null;

        const lastMatch = matches[matches.length - 1];
        const parts = lastMatch.split(":").map(Number);

        if (parts.length === 2) {
          return parts[0] * 60 + parts[1];
        }

        if (parts.length === 3) {
          return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        return null;
      }

      function removeElementHard(el) {
        if (!el) return;

        el.style.setProperty("display", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
        el.style.setProperty("opacity", "0", "important");
        el.style.setProperty("height", "0px", "important");
        el.style.setProperty("max-height", "0px", "important");
        el.style.setProperty("min-height", "0px", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("overflow", "hidden", "important");

        try {
          el.remove();
        } catch {}
      }

      function looksLikeShortsElement(el) {
        if (!el) return false;

        const text = (el.innerText || el.textContent || "").toLowerCase();
        const html = (el.innerHTML || "").toLowerCase();

        const links = Array.from(el.querySelectorAll ? el.querySelectorAll("a") : []);
        const hasShortsLink = links.some((link) => {
          const href = (link.getAttribute("href") || "").toLowerCase();
          return href.includes("/shorts");
        });

        const ariaText = Array.from(
          el.querySelectorAll ? el.querySelectorAll("[aria-label]") : []
        )
          .map((node) => (node.getAttribute("aria-label") || "").toLowerCase())
          .join(" ");

        const combined = text + " " + html + " " + ariaText;

        const durationSeconds = parseDurationToSeconds(combined);

        const hasShortsKeyword =
          combined.includes("shorts") ||
          combined.includes("#shorts") ||
          hasShortsLink;

        const isUnderOneAndHalfMinutes =
          durationSeconds !== null && durationSeconds <= 70;

        return hasShortsKeyword || isUnderOneAndHalfMinutes;
      }

      function blockYouTubeShortsEverywhere() {
        if (!isYouTube()) return;

        const path = location.pathname.toLowerCase();

        if (path.startsWith("/shorts")) {
          location.replace("https://m.youtube.com/");
          return;
        }

        const directShortsSelectors = [
          'a[href^="/shorts"]',
          'a[href*="/shorts/"]',
          'a[href^="https://www.youtube.com/shorts"]',
          'a[href^="https://m.youtube.com/shorts"]',
          'ytm-reel-shelf-renderer',
          'ytd-reel-shelf-renderer',
          'ytm-shorts-lockup-view-model',
          'ytd-shorts',
          'ytd-reel-video-renderer',
          'ytm-rich-shelf-renderer',
          'ytd-rich-shelf-renderer',
          'reel-shelf-renderer',
          '[title="Shorts"]',
          '[aria-label="Shorts"]'
        ];

        directShortsSelectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            const container =
              el.closest("ytm-rich-item-renderer") ||
              el.closest("ytm-video-with-context-renderer") ||
              el.closest("ytm-compact-video-renderer") ||
              el.closest("ytd-video-renderer") ||
              el.closest("ytd-rich-item-renderer") ||
              el.closest("ytm-item-section-renderer") ||
              el;

            removeElementHard(container);
          });
        });

        const resultSelectors = [
          "ytm-video-with-context-renderer",
          "ytm-compact-video-renderer",
          "ytm-rich-item-renderer",
          "ytm-reel-shelf-renderer",
          "ytm-shorts-lockup-view-model",
          "ytd-video-renderer",
          "ytd-rich-item-renderer",
          "ytd-reel-shelf-renderer",
          "ytd-rich-shelf-renderer"
        ];

        resultSelectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((item) => {
            if (looksLikeShortsElement(item)) {
              removeElementHard(item);
            }
          });
        });

        document.querySelectorAll("a").forEach((link) => {
          const href = (link.getAttribute("href") || "").toLowerCase();

          if (href.includes("/shorts")) {
            const container =
              link.closest("ytm-rich-item-renderer") ||
              link.closest("ytm-video-with-context-renderer") ||
              link.closest("ytm-compact-video-renderer") ||
              link.closest("ytd-video-renderer") ||
              link.closest("ytd-rich-item-renderer") ||
              link.closest("ytm-item-section-renderer") ||
              link;

            removeElementHard(container);
          }
        });
      }

      function protectYouTubeHistoryFromShorts() {
        if (window.__halalShortsHistoryProtected) return;
        window.__halalShortsHistoryProtected = true;

        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function() {
          originalPushState.apply(this, arguments);

          setTimeout(() => {
            if (
              isYouTube() &&
              location.pathname.toLowerCase().startsWith("/shorts")
            ) {
              location.replace("https://m.youtube.com/");
            }
          }, 0);
        };

        history.replaceState = function() {
          originalReplaceState.apply(this, arguments);

          setTimeout(() => {
            if (
              isYouTube() &&
              location.pathname.toLowerCase().startsWith("/shorts")
            ) {
              location.replace("https://m.youtube.com/");
            }
          }, 0);
        };

        window.addEventListener("popstate", () => {
          if (
            isYouTube() &&
            location.pathname.toLowerCase().startsWith("/shorts")
          ) {
            location.replace("https://m.youtube.com/");
          }
        });
      }

      function removeYouTubeNativeNav() {
        if (!isYouTube()) return;

        const selectors = [
          "ytm-pivot-bar-renderer",
          "ytm-bottom-navigation-renderer",
          "tp-yt-app-drawer",
          "[role='tablist']",
          "a[href='/shorts']",
          "a[href^='/shorts']",
          "a[href*='/shorts/']",
          "a[href='/subscriptions']",
          "a[href='/feed/you']",
          "a[href='/feed/library']",
          "a[href='/feed/history']",
          "a[href='/feed/subscriptions']"
        ];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            removeElementHard(el);
          });
        });
      }

      function applyYouTubeHomeBlock() {
        if (isYouTubeHome()) {
          document.body.classList.add("halal-youtube-home-block");
        } else {
          document.body.classList.remove("halal-youtube-home-block");
        }
      }

      function applyInstagramProfileFix() {
        const isIG = location.hostname.includes("instagram.com");
        if (!isIG) return;

        const path = location.pathname;

        const isSystemPage =
          path.startsWith("/explore") ||
          path.startsWith("/direct") ||
          path.startsWith("/reels") ||
          path.startsWith("/reel") ||
          path.startsWith("/p/") ||
          path.startsWith("/accounts") ||
          path.startsWith("/stories");

        const looksLikeProfile =
          !isSystemPage &&
          path !== "/" &&
          path.split("/").filter(Boolean).length >= 1;

        if (looksLikeProfile) {
          document.body.classList.add("halal-instagram-profile-page");

          document
            .querySelectorAll(
              '[role="tab"], [role="tablist"], a[href$="/tagged/"], a[href*="/tagged"]'
            )
            .forEach((el) => {
              el.style.setProperty("display", "flex", "important");
              el.style.setProperty("visibility", "visible", "important");
              el.style.setProperty("opacity", "1", "important");
              el.style.setProperty("height", "auto", "important");
              el.style.setProperty("max-height", "none", "important");
              el.style.setProperty("pointer-events", "auto", "important");
              el.style.setProperty("transform", "none", "important");
            });

          document
            .querySelectorAll(
              'a[href*="/reels/"], a[href$="/reels/"], a[aria-label="Reels"], svg[aria-label="Reels"]'
            )
            .forEach((el) => {
              removeElementHard(el);
            });
        } else {
          document.body.classList.remove("halal-instagram-profile-page");
        }
      }

      function removeInstagramExploreLoading() {
        const selectors = [
          'svg[aria-label="Loading..."]',
          'svg[aria-label="Laden..."]',
          '[aria-label="Loading..."]',
          '[aria-label="Laden..."]',
          '[role="progressbar"]',
          'div[style*="animation"]',
          'div[style*="transform: rotate"]',
          'div[style*="rotate("]',
          '._ab8w',
          '._ab8x',
          '._ab8y',
          '._ab8z'
        ];

        selectors.forEach((selector) => {
          document.querySelectorAll(selector).forEach((el) => {
            removeElementHard(el);
          });
        });
      }

      function applyInstagramExploreClean() {
        const isIG = location.hostname.includes("instagram.com");
        if (!isIG) return;

        const isExplore =
          location.pathname === "/explore/" ||
          location.pathname === "/explore" ||
          location.pathname.startsWith("/explore/");

        if (isExplore) {
          document.body.classList.add("halal-instagram-explore-clean");

          document
            .querySelectorAll(
              'main article, main video, main img, main a[href^="/p/"], main a[href^="/reel/"], main a[href^="/reels/"]'
            )
            .forEach((el) => {
              removeElementHard(el);
            });

          removeInstagramExploreLoading();
          window.scrollTo(0, 0);
        } else {
          document.body.classList.remove("halal-instagram-explore-clean");
        }
      }

      function applyDMBlock() {
        const isIG = location.hostname.includes("instagram.com");
        if (!isIG) return;

        // Only trigger when actually inside a DM thread URL
        const isDM = location.pathname.includes("/direct/");

        const hasReel =
          document.querySelector('video') &&
          (document.querySelector('[role="dialog"]') ||
            document.querySelector('._aagu'));

        if (isDM && hasReel) {
          document.body.classList.add("halal-dm-reel-block");

          document
            .querySelectorAll(
              '[aria-label="Back"], [aria-label="Close"], [aria-label*="Audio"], [aria-label*="audio"], [aria-label*="Sound"], [aria-label*="sound"], button'
            )
            .forEach((el) => {
              el.style.pointerEvents = "auto";
              el.style.touchAction = "manipulation";
              el.style.zIndex = "2147483647";
            });
        } else {
          document.body.classList.remove("halal-dm-reel-block");
        }
      }

      function runAll() {
        injectCSS();
        protectYouTubeHistoryFromShorts();
        blockYouTubeShortsEverywhere();
        removeYouTubeNativeNav();
        applyDMBlock();
        applyInstagramProfileFix();
        applyInstagramExploreClean();
        applyYouTubeHomeBlock();
      }

      runAll();

      const observer = new MutationObserver(() => {
        runAll();
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
      });

      setInterval(() => {
        runAll();
      }, 200);

      document.addEventListener(
        "click",
        function(e) {
          const target = e.target;
          const link = target && target.closest ? target.closest("a") : null;

          if (link) {
            const href = link.getAttribute("href") || "";

            if (isYouTube() && href.toLowerCase().includes("/shorts")) {
              e.preventDefault();
              e.stopImmediatePropagation();
              location.replace("https://m.youtube.com/");
            }
          }
        },
        { capture: true }
      );

      document.addEventListener(
        "touchmove",
        function(e) {
          if (
            document.body.classList.contains("halal-dm-reel-block") &&
            !isAllowedControl(e.target)
          ) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          if (document.body.classList.contains("halal-youtube-home-block")) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          if (document.body.classList.contains("halal-instagram-explore-clean")) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        },
        { passive: false, capture: true }
      );

      document.addEventListener(
        "wheel",
        function(e) {
          if (
            document.body.classList.contains("halal-dm-reel-block") &&
            !isAllowedControl(e.target)
          ) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          if (document.body.classList.contains("halal-youtube-home-block")) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }

          if (document.body.classList.contains("halal-instagram-explore-clean")) {
            e.preventDefault();
            e.stopImmediatePropagation();
          }
        },
        { passive: false, capture: true }
      );

      document.addEventListener(
        "scroll",
        function() {
          if (document.body.classList.contains("halal-dm-reel-block")) {
            window.scrollTo(0, 0);
          }

          if (document.body.classList.contains("halal-youtube-home-block")) {
            window.scrollTo(0, 0);
          }

          if (document.body.classList.contains("halal-instagram-explore-clean")) {
            removeInstagramExploreLoading();
            window.scrollTo(0, 0);
          }
        },
        { capture: true }
      );
    })();

    true;
  `;

  const reinjectHalalScript = () => {
    webViewRef.current?.injectJavaScript(halalScript);

    setTimeout(() => {
      webViewRef.current?.injectJavaScript(halalScript);
    }, 300);

    setTimeout(() => {
      webViewRef.current?.injectJavaScript(halalScript);
    }, 900);
  };

  const goBackToApp = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const goBackInsideWebView = () => {
    if (isYouTubeWatchPage && lastYouTubeResultsUrl) {
      const targetUrl = JSON.stringify(lastYouTubeResultsUrl);

      webViewRef.current?.injectJavaScript(`
        window.location.href = ${targetUrl};
        true;
      `);

      setIsYouTubeWatchPage(false);
      setIsYouTubeHomePage(false);
      setIsYouTubePage(true);
      return;
    }

    if (canWebViewGoBack) {
      webViewRef.current?.goBack();
    } else {
      goBackToApp();
    }
  };

  const goToYouTubeHome = () => {
    setIsYouTubePage(true);
    setIsYouTubeHomePage(true);
    setIsYouTubeSwitching(false);
    setIsYouTubeWatchPage(false);

    webViewRef.current?.injectJavaScript(`
      window.location.href = 'https://m.youtube.com/';
      true;
    `);

    reinjectHalalScript();
  };

  const goToYouTubeYouPage = () => {
    setIsYouTubePage(true);
    setIsYouTubeHomePage(false);
    setIsYouTubeSwitching(true);
    setIsYouTubeWatchPage(false);

    webViewRef.current?.injectJavaScript(`
      document.body.style.background = '#000';
      document.documentElement.style.background = '#000';
      window.location.href = 'https://m.youtube.com/feed/library';
      true;
    `);

    reinjectHalalScript();
  };

  const searchYouTube = (customQuery?: string) => {
    const query = (customQuery || youtubeSearch).trim();

    if (!query) return;

    Keyboard.dismiss();

    const encodedQuery = encodeURIComponent(query);

    const resultsUrl = `https://m.youtube.com/results?search_query=${encodedQuery}&sp=EgIYAg%253D%253D`;

    setYoutubeSearch(query);
    setYoutubeSuggestions([]);
    setLastYouTubeResultsUrl(resultsUrl);
    setIsYouTubePage(true);
    setIsYouTubeHomePage(false);
    setIsYouTubeSwitching(false);
    setIsYouTubeWatchPage(false);

    webViewRef.current?.injectJavaScript(`
      window.location.href = '${resultsUrl}';
      true;
    `);

    reinjectHalalScript();

    setTimeout(() => {
      reinjectHalalScript();
    }, 700);

    setTimeout(() => {
      reinjectHalalScript();
    }, 1600);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: initialUrl }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        onShouldStartLoadWithRequest={(request) => {
          const targetUrl = request.url || "";

          if (isBlockedYouTubeShortsUrl(targetUrl)) {
            blockYouTubeShorts();
            return false;
          }

          return true;
        }}
        injectedJavaScriptBeforeContentLoaded={halalScript}
        injectedJavaScript={halalScript}
        onLoadEnd={(event) => {
          reinjectHalalScript();

          const currentUrl = event.nativeEvent.url || "";

          if (isBlockedYouTubeShortsUrl(currentUrl)) {
            blockYouTubeShorts();
            return;
          }

          if (
            currentUrl.includes("/feed/library") ||
            currentUrl.includes("/feed/you")
          ) {
            setIsYouTubeSwitching(false);
            setIsYouTubeHomePage(false);
            setIsYouTubePage(true);
            setIsYouTubeWatchPage(false);
          }
        }}
        onNavigationStateChange={(navState) => {
          const currentUrl = navState.url || "";

          if (isBlockedYouTubeShortsUrl(currentUrl)) {
            blockYouTubeShorts();
            return;
          }

          setCanWebViewGoBack(navState.canGoBack);
          checkYouTubeState(currentUrl);

          if (
            currentUrl.includes("youtube.com/results") &&
            currentUrl.includes("search_query=")
          ) {
            setLastYouTubeResultsUrl(currentUrl);
          }

          if (
            currentUrl.includes("youtube.com") ||
            currentUrl.includes("youtu.be") ||
            currentUrl.includes("instagram.com")
          ) {
            reinjectHalalScript();
          }
        }}
        cacheEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        allowsInlineMediaPlayback={true}
      />

      {isYouTubeHomePage && !isYouTubeSwitching && (
        <View
          style={[
            styles.youtubeHomeOverlay,
            {
              backgroundColor: youtubeOverlayBackground,
              bottom: bottomBarHeight,
            },
          ]}
        >
          <View style={styles.youtubeSearchWrapper}>
            <View
              style={[
                styles.youtubeSearchBar,
                {
                  backgroundColor: youtubeSearchBackground,
                  borderColor: youtubeSearchBorder,
                },
              ]}
            >
              <Ionicons name="search" size={20} color={youtubeSubtitleColor} />

              <TextInput
                value={youtubeSearch}
                onChangeText={setYoutubeSearch}
                onSubmitEditing={() => searchYouTube()}
                placeholder="Search YouTube"
                placeholderTextColor={youtubePlaceholderColor}
                returnKeyType="search"
                autoCapitalize="none"
                autoCorrect={false}
                style={[
                  styles.youtubeSearchInput,
                  { color: youtubeInputColor },
                ]}
              />

              {youtubeSearch.length > 0 && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setYoutubeSearch("");
                    setYoutubeSuggestions([]);
                  }}
                >
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={youtubeSubtitleColor}
                  />
                </TouchableOpacity>
              )}
            </View>

            {youtubeSuggestions.length > 0 && (
              <View
                style={[
                  styles.youtubeSuggestionsBox,
                  {
                    backgroundColor: youtubeSuggestionBoxBackground,
                    borderColor: youtubeSuggestionBorder,
                  },
                ]}
              >
                {youtubeSuggestions.map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    activeOpacity={0.75}
                    onPress={() => searchYouTube(suggestion)}
                    style={styles.youtubeSuggestionItem}
                  >
                    <Ionicons
                      name="search-outline"
                      size={17}
                      color={youtubeSubtitleColor}
                    />

                    <Text
                      numberOfLines={1}
                      style={[
                        styles.youtubeSuggestionText,
                        { color: youtubeSuggestionTextColor },
                      ]}
                    >
                      {suggestion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.youtubeHomeContent}>
            <View
              style={[
                styles.youtubeHomeCard,
                {
                  backgroundColor: youtubeCardBackground,
                  borderColor: youtubeCardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.youtubeIconCircle,
                  { backgroundColor: youtubeIconCircleBackground },
                ]}
              >
                <Ionicons name="search" size={34} color={youtubeTitleColor} />
              </View>

              <Text
                style={[styles.youtubeHomeTitle, { color: youtubeTitleColor }]}
              >
                Try searching for something
              </Text>

              <Text
                style={[
                  styles.youtubeHomeSubtitle,
                  { color: youtubeSubtitleColor },
                ]}
              >
                No random feed. Search intentionally and choose what you watch.
              </Text>
            </View>
          </View>
        </View>
      )}

      {isYouTubeSwitching && (
        <View
          pointerEvents="auto"
          style={[
            styles.youtubeSwitchBlocker,
            {
              backgroundColor: youtubeOverlayBackground,
              bottom: bottomBarHeight,
            },
          ]}
        />
      )}

      <TouchableOpacity
        style={[
          isYouTubeWatchPage && lastYouTubeResultsUrl
            ? styles.searchReturnButton
            : styles.returnButton,
          {
            backgroundColor: returnButtonBackground,
            top: Platform.OS === "android" ? 34 : 54,
          },
        ]}
        activeOpacity={0.8}
        onPress={
          isYouTubeWatchPage && lastYouTubeResultsUrl
            ? goBackInsideWebView
            : goBackToApp
        }
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={
            isYouTubeWatchPage && lastYouTubeResultsUrl
              ? "arrow-back"
              : "chevron-back"
          }
          size={16}
          color={returnButtonColor}
        />

        {isYouTubeWatchPage && lastYouTubeResultsUrl && (
          <Text style={[styles.searchReturnText, { color: returnButtonColor }]}>
            Search
          </Text>
        )}
      </TouchableOpacity>

      {isYouTubePage && (
        <View
          style={[
            styles.customBottomBar,
            {
              backgroundColor: barBackground,
              borderTopColor: barBorder,
              height: bottomBarHeight,
              paddingBottom: Platform.OS === "android" ? 18 : 0,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={goToYouTubeHome}
            activeOpacity={0.75}
            hitSlop={{ top: 18, bottom: 18, left: 28, right: 28 }}
          >
            <Ionicons
              name="home"
              size={24}
              color={isYouTubeHomePage ? activeColor : inactiveColor}
            />

            <Text
              style={[
                styles.bottomText,
                { color: isYouTubeHomePage ? activeColor : inactiveColor },
              ]}
            >
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bottomButton}
            onPress={goToYouTubeYouPage}
            activeOpacity={0.75}
            hitSlop={{ top: 18, bottom: 18, left: 28, right: 28 }}
          >
            <Ionicons
              name="person-circle-outline"
              size={26}
              color={!isYouTubeHomePage ? activeColor : inactiveColor}
            />

            <Text
              style={[
                styles.bottomText,
                { color: !isYouTubeHomePage ? activeColor : inactiveColor },
              ]}
            >
              You
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  webview: {
    flex: 1,
    backgroundColor: "#000",
  },

  youtubeHomeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9000,
    elevation: 9000,
  },

  youtubeSwitchBlocker: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9800,
    elevation: 9800,
  },

  youtubeSearchWrapper: {
    position: "absolute",
    top: Platform.OS === "android" ? 48 : 48,
    left: 64,
    right: 16,
    zIndex: 9500,
    elevation: 9500,
  },

  youtubeSearchBar: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  youtubeSearchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    paddingHorizontal: 10,
    paddingVertical: 0,
  },

  youtubeSuggestionsBox: {
    marginTop: 8,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },

  youtubeSuggestionItem: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },

  youtubeSuggestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },

  youtubeHomeContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 125,
  },

  youtubeHomeCard: {
    width: "100%",
    maxWidth: 330,
    minHeight: 230,
    borderRadius: 28,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 26,
    paddingVertical: 28,
  },

  youtubeIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  youtubeHomeTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  youtubeHomeSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 21,
  },

  returnButton: {
    position: "absolute",
    left: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
    elevation: 10000,
  },

  searchReturnButton: {
    position: "absolute",
    left: 8,
    height: 34,
    borderRadius: 17,
    paddingLeft: 9,
    paddingRight: 11,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    zIndex: 10000,
    elevation: 10000,
  },

  searchReturnText: {
    fontSize: 12,
    fontWeight: "700",
  },

  customBottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    zIndex: 9999,
    elevation: 9999,
  },

  bottomButton: {
    flex: 1,
    minHeight: Platform.OS === "android" ? 78 : 64,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? 10 : 8,
    paddingBottom: Platform.OS === "android" ? 18 : 8,
  },

  bottomText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView, WebViewNavigation } from "react-native-webview";

const PROFILE_URL = "https://www.tiktok.com/profile";
const START_LOGIN_URL =
  "https://www.tiktok.com/login?redirect_url=https%3A%2F%2Fwww.tiktok.com%2Fprofile";

const DESKTOP_USER_AGENT =
  Platform.OS === "ios"
    ? "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
    : "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function isBlockedNativeUrl(url: string) {
  const lower = url.toLowerCase();

  return (
    lower.startsWith("tiktok://") ||
    lower.startsWith("snssdk://") ||
    lower.startsWith("intent://") ||
    lower.startsWith("market://") ||
    lower.includes("apps.apple.com") ||
    lower.includes("itunes.apple.com") ||
    lower.includes("play.google.com/store")
  );
}

function isTikTokVideoUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (!host.endsWith("tiktok.com")) return false;

    return parsed.pathname.includes("/video/");
  } catch {
    return false;
  }
}

function isDiscoverOrFeedUrl(url: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    if (!host.endsWith("tiktok.com")) return false;

    const p = parsed.pathname;

    return (
      p === "/" ||
      p === "" ||
      p.includes("/discover") ||
      p.includes("/foryou") ||
      p.includes("/following") ||
      p.includes("/friends") ||
      p.includes("/live")
    );
  } catch {
    return false;
  }
}

function isAllowedWebUrl(url: string) {
  const lower = url.toLowerCase();

  if (isBlockedNativeUrl(lower)) return false;

  if (
    lower.startsWith("about:blank") ||
    lower.startsWith("about:srcdoc") ||
    lower.startsWith("data:")
  ) {
    return true;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");

    const allowedHosts = [
      "tiktok.com",
      "m.tiktok.com",
      "google.com",
      "accounts.google.com",
      "gstatic.com",
      "googleusercontent.com",
      "googleapis.com",
      "oauth2.googleapis.com",
      "facebook.com",
      "m.facebook.com",
      "connect.facebook.net",
      "appleid.apple.com",
      "apple.com",
      "idmsa.apple.com",
      "captcha.tiktok.com",
      "verify-sg.tiktok.com",
      "verify-va.tiktok.com",
      "byteoversea.com",
      "ibyteimg.com",
      "tiktokcdn.com",
      "ttwstatic.com",
      "tiktokv.com",
      "muscdn.com",
      "musical.ly",
    ];

    return allowedHosts.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
  } catch {
    return false;
  }
}

function getSafeMainUrl(url: string) {
  if (!url) return PROFILE_URL;
  if (url.startsWith("about:")) return PROFILE_URL;
  if (!isAllowedWebUrl(url)) return PROFILE_URL;
  if (isTikTokVideoUrl(url)) return PROFILE_URL;
  if (isDiscoverOrFeedUrl(url)) return PROFILE_URL;

  return url;
}

// ---------------------------------------------------------------------------
// Injected JS
// ---------------------------------------------------------------------------

const injectedJavaScript = `
(function () {
  if (window.__SIMPLE_TIKTOK_AUDIO_SYNC_STRONG__) {
    if (window.__HS_APPLY_ALL__) {
      window.__HS_APPLY_ALL__(false);
    }
    true;
    return;
  }

  window.__SIMPLE_TIKTOK_AUDIO_SYNC_STRONG__ = true;

  let lastUrl = location.href;
  let lastNonVideoUrl = location.href;
  let currentVideoUrl = "";
  let mainVideo = null;
  let applyTimer = null;
  let lightTimer = null;

  function isVideoPage() {
    return /\\/video\\//.test(location.pathname);
  }

  function sendToNative(type, payload) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: type,
        payload: payload || {},
        url: location.href
      }));
    } catch (e) {}
  }

  function scheduleApply(heavy) {
    clearTimeout(applyTimer);

    applyTimer = setTimeout(function() {
      applyAll(!!heavy);
    }, heavy ? 100 : 280);
  }

  var meta = document.querySelector('meta[name="viewport"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }

  meta.setAttribute(
    'content',
    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
  );

  var style = document.createElement('style');
  style.id = 'simple-tiktok-style';

  style.innerHTML = \`
    html, body {
      background: #000 !important;
      width: 100% !important;
      min-width: 0 !important;
      max-width: 100vw !important;
      min-height: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow-x: hidden !important;
      overscroll-behavior-y: contain !important;
      -webkit-text-size-adjust: 100% !important;
    }

    *, *::before, *::after {
      box-sizing: border-box !important;
    }

    img, video, canvas, svg {
      max-width: 100% !important;
    }

    [data-e2e="bottom-nav"],
    [data-e2e="nav-footer"],
    [data-e2e="download-app"],
    [data-e2e="app-download"],
    [data-e2e="open-app"],
    [data-e2e="desktop-download-bar"],
    [data-e2e="mobile-download-banner"],
    [data-e2e="upload-icon"],
    [data-e2e="nav-upload"],
    a[href^="tiktok://"],
    a[href^="snssdk://"],
    a[href^="intent://"],
    a[href*="apps.apple.com"],
    a[href*="play.google.com/store"],
    button[aria-label*="Open TikTok"],
    button[aria-label*="open TikTok"],
    button[aria-label*="Get TikTok"],
    button[aria-label*="get TikTok"],
    a[href="/"],
    a[href="https://www.tiktok.com/"],
    a[href*="/discover"],
    a[href*="/foryou"],
    a[href*="/following"],
    a[href*="/friends"],
    a[href*="/live"],
    a[href*="/upload"],
    a[href*="/coin"],
    a[href*="/creator-center"],
    a[href*="/business"],
    aside,
    footer,
    nav {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    input,
    textarea,
    form {
      pointer-events: auto !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    [data-e2e="recommend-list-item-container"],
    [data-e2e="video-card"],
    [data-e2e="video-container"] {
      display: block !important;
      visibility: visible !important;
      pointer-events: auto !important;
    }

    [data-e2e="comment-list"],
    [data-e2e="comment-input"],
    [data-e2e="browse-comment"],
    [data-e2e="search-comment-container"],
    [data-e2e="video-detail-comment"],
    [data-e2e="next-video"],
    [data-e2e="browse-close"],
    [data-e2e="video-close"],
    [class*="Comment"],
    [class*="comment"],
    [class*="DivComment"],
    [class*="DivCommentContainer"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    video {
      position: relative !important;
      width: 100% !important;
      height: auto !important;
      max-height: 100vh !important;
      object-fit: contain !important;
      background: #000 !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      pointer-events: auto !important;
      margin: 0 auto !important;
    }

    video::-webkit-media-controls,
    video::-webkit-media-controls-panel,
    video::-webkit-media-controls-start-playback-button,
    video::-webkit-media-controls-play-button,
    video::-webkit-media-controls-fullscreen-button {
      display: none !important;
    }

    [role="dialog"],
    div[aria-modal="true"],
    div[class*="Login"],
    div[class*="login"] {
      max-width: calc(100vw - 24px) !important;
      width: calc(100vw - 24px) !important;
      min-width: 0 !important;
      max-height: calc(100vh - 110px) !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
      border-radius: 14px !important;
    }

    [role="dialog"] *,
    div[aria-modal="true"] *,
    div[class*="Login"] *,
    div[class*="login"] * {
      max-width: 100% !important;
      box-sizing: border-box !important;
    }

    body.__hs_video_open__ {
      background: #000 !important;
      overflow: hidden !important;
    }

    body.__hs_video_open__ #app,
    body.__hs_video_open__ #__next,
    body.__hs_video_open__ main {
      background: #000 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
    }

    body.__hs_video_open__ aside,
    body.__hs_video_open__ nav,
    body.__hs_video_open__ footer,
    body.__hs_video_open__ header,
    body.__hs_video_open__ form,
    body.__hs_video_open__ input,
    body.__hs_video_open__ textarea,
    body.__hs_video_open__ [data-e2e*="comment"],
    body.__hs_video_open__ [class*="Comment"],
    body.__hs_video_open__ [class*="comment"],
    body.__hs_video_open__ [class*="DivComment"],
    body.__hs_video_open__ [class*="DivCommentContainer"],
    body.__hs_video_open__ [data-e2e="browse-video-desc"],
    body.__hs_video_open__ [data-e2e="browse-user-avatar"],
    body.__hs_video_open__ [data-e2e="browse-username"],
    body.__hs_video_open__ [data-e2e="browse-like-icon"],
    body.__hs_video_open__ [data-e2e="browse-share-icon"],
    body.__hs_video_open__ [data-e2e="recommend-list-item-container"],
    body.__hs_video_open__ [data-e2e="search-card-container"],
    body.__hs_video_open__ [data-e2e="search-top-item"] {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    body.__hs_video_open__ picture,
    body.__hs_video_open__ canvas {
      display: none !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    body.__hs_video_open__ video.__hs_main_video__ {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      z-index: 2147483000 !important;
      width: 100vw !important;
      height: 100vh !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      min-width: 100vw !important;
      min-height: 100vh !important;
      object-fit: contain !important;
      background: #000 !important;
      margin: 0 !important;
      padding: 0 !important;
      transform: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: auto !important;
    }

    body.__hs_video_open__ video.__hs_hidden_video__ {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      width: 1px !important;
      height: 1px !important;
      max-width: 1px !important;
      max-height: 1px !important;
      position: fixed !important;
      left: -9999px !important;
      top: -9999px !important;
    }

    body.__hs_video_open__ .hs-one-close {
      display: flex !important;
      visibility: visible !important;
      pointer-events: auto !important;
      position: fixed !important;
      top: 14px !important;
      left: 14px !important;
      width: 44px !important;
      height: 44px !important;
      border-radius: 999px !important;
      z-index: 2147483647 !important;
      background: rgba(0, 0, 0, 0.75) !important;
      color: white !important;
      border: 1px solid rgba(255, 255, 255, 0.25) !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 32px !important;
      line-height: 40px !important;
      font-family: Arial, sans-serif !important;
      font-weight: 400 !important;
      box-sizing: border-box !important;
    }
  \`;

  document.head.appendChild(style);

  function hideEl(el) {
    if (!el) return;

    el.style.setProperty('display', 'none', 'important');
    el.style.setProperty('visibility', 'hidden', 'important');
    el.style.setProperty('pointer-events', 'none', 'important');
  }

  function showInputOnly(el) {
    if (!el) return;

    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('pointer-events', 'auto', 'important');
    el.style.setProperty('opacity', '1', 'important');
  }

  function keepSearchInputAlive() {
    if (isVideoPage()) return;

    document.querySelectorAll('input, textarea, form').forEach(function(el) {
      showInputOnly(el);
    });
  }

  function cleanNav() {
    if (isVideoPage()) return;

    document.querySelectorAll('a, button, div[role="button"], div').forEach(function (el) {
      var text = (el.innerText || el.textContent || '').trim().toLowerCase();

      if (text) {
        var hide =
          text === 'discover' ||
          text === 'for you' ||
          text === 'following' ||
          text === 'friends' ||
          text === 'live' ||
          text === 'upload' ||
          text === 'explore' ||
          text === 'home';

        var keep =
          text === 'search' ||
          text === 'inbox' ||
          text === 'messages' ||
          text === 'profile';

        if (hide && !keep) hideEl(el);
      }

      var href = '';

      try {
        href = (el.getAttribute('href') || '').toLowerCase();
      } catch (e) {}

      var isBlocked =
        href === '/' ||
        href === 'https://www.tiktok.com/' ||
        href.indexOf('/discover') !== -1 ||
        href.indexOf('/foryou') !== -1 ||
        href.indexOf('/following') !== -1 ||
        href.indexOf('/friends') !== -1 ||
        href.indexOf('/live') !== -1 ||
        href.indexOf('/upload') !== -1 ||
        href.indexOf('/coin') !== -1 ||
        href.indexOf('/creator-center') !== -1 ||
        href.indexOf('/business') !== -1;

      if (isBlocked) hideEl(el);
    });

    keepSearchInputAlive();
  }

  function setupVideos() {
    document.querySelectorAll('video').forEach(function(v) {
      v.setAttribute('playsinline', 'true');
      v.setAttribute('webkit-playsinline', 'true');
      v.setAttribute('disablepictureinpicture', 'true');
      v.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');

      /*
        Audio sync fix:
        Do NOT call play(), pause(), muted=false, or custom tap pause/play here.
        TikTok's own player must control audio timing.
      */
      v.removeAttribute('controls');
      v.controls = false;
    });
  }

  function pickMainVideo() {
    var videos = Array.from(document.querySelectorAll('video'));

    if (videos.length < 1) return null;

    videos.sort(function(a, b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();

      return (br.width * br.height) - (ar.width * ar.height);
    });

    return videos[0];
  }

  function lockMainVideo() {
    if (!isVideoPage()) {
      mainVideo = null;
      currentVideoUrl = "";

      document.querySelectorAll('video').forEach(function(v) {
        v.classList.remove('__hs_main_video__');
        v.classList.remove('__hs_hidden_video__');
      });

      return;
    }

    var urlChanged = currentVideoUrl !== location.href;

    if (urlChanged) {
      currentVideoUrl = location.href;
      mainVideo = null;
    }

    if (!mainVideo || !document.body.contains(mainVideo)) {
      mainVideo = pickMainVideo();
    }

    if (!mainVideo) return;

    document.querySelectorAll('video').forEach(function(v) {
      if (v === mainVideo) {
        v.classList.add('__hs_main_video__');
        v.classList.remove('__hs_hidden_video__');
      } else {
        v.classList.remove('__hs_main_video__');
        v.classList.add('__hs_hidden_video__');
      }
    });
  }

  function closeVideoPage() {
    sendToNative('CLOSE_VIDEO', { fallbackUrl: lastNonVideoUrl });

    setTimeout(function() {
      try {
        if (lastNonVideoUrl && lastNonVideoUrl.indexOf('/video/') === -1) {
          window.location.href = lastNonVideoUrl;
        } else {
          history.back();
        }
      } catch (e) {
        history.back();
      }
    }, 80);
  }

  function ensureCloseButton() {
    var oldClose = document.querySelector('.hs-one-close');

    if (!isVideoPage()) {
      if (oldClose) oldClose.remove();
      return;
    }

    if (oldClose) return;

    var close = document.createElement('button');
    close.className = 'hs-one-close';
    close.type = 'button';
    close.innerText = '×';

    close.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      closeVideoPage();
    }, true);

    document.body.appendChild(close);
  }

  function makeVideoPageClean(heavy) {
    if (isVideoPage()) {
      document.body.classList.add('__hs_video_open__');

      if (heavy) {
        document.querySelectorAll(
          '[data-e2e*="comment"], [class*="Comment"], [class*="comment"], [class*="DivComment"], [class*="DivCommentContainer"], aside, nav, footer, header, form, input, textarea'
        ).forEach(hideEl);
      }

      lockMainVideo();
      ensureCloseButton();
    } else {
      document.body.classList.remove('__hs_video_open__');

      var oldClose = document.querySelector('.hs-one-close');

      if (oldClose) oldClose.remove();

      lastNonVideoUrl = location.href;
      mainVideo = null;
      currentVideoUrl = "";

      document.querySelectorAll('video').forEach(function(v) {
        v.classList.remove('__hs_main_video__');
        v.classList.remove('__hs_hidden_video__');
      });

      keepSearchInputAlive();
    }
  }

  function watchUrl() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;

      if (!isVideoPage()) {
        lastNonVideoUrl = location.href;
      } else {
        mainVideo = null;
        currentVideoUrl = location.href;
      }

      setTimeout(function() { applyAll(true); }, 80);
      setTimeout(function() { applyAll(true); }, 300);
      setTimeout(function() { applyAll(false); }, 900);
    }
  }

  function applyAll(heavy) {
    watchUrl();

    if (!isVideoPage()) {
      cleanNav();
      keepSearchInputAlive();
    }

    setupVideos();
    makeVideoPageClean(!!heavy);
  }

  window.__HS_APPLY_ALL__ = applyAll;

  var originalPushState = history.pushState;

  history.pushState = function() {
    var result = originalPushState.apply(this, arguments);

    setTimeout(function() {
      applyAll(true);
    }, 0);

    return result;
  };

  var originalReplaceState = history.replaceState;

  history.replaceState = function() {
    var result = originalReplaceState.apply(this, arguments);

    setTimeout(function() {
      applyAll(true);
    }, 0);

    return result;
  };

  window.addEventListener('popstate', function() {
    setTimeout(function() {
      applyAll(true);
    }, 0);
  });

  applyAll(true);

  [180, 450, 900, 1600].forEach(function (t) {
    setTimeout(function () {
      applyAll(true);
    }, t);
  });

  clearInterval(lightTimer);

  lightTimer = setInterval(function () {
    watchUrl();

    if (isVideoPage()) {
      ensureCloseButton();

      /*
        Very light touch while video plays.
        No play/pause/mute changes.
      */
      if (!mainVideo || !document.body.contains(mainVideo)) {
        lockMainVideo();
      }
    } else {
      applyAll(false);
    }
  }, 2500);

  var mo = new MutationObserver(function () {
    if (isVideoPage()) {
      scheduleApply(false);
    } else {
      scheduleApply(true);
    }
  });

  if (document.body) {
    mo.observe(document.body, { childList: true, subtree: true });
  }
})();
true;
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TikTokScreen() {
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [mainUrl, setMainUrl] = useState(START_LOGIN_URL);
  const [canGoBack, setCanGoBack] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastSafeUrlRef = useRef<string>(START_LOGIN_URL);
  const currentUrlRef = useRef<string>(START_LOGIN_URL);

  const source = useMemo(() => ({ uri: mainUrl }), [mainUrl]);

  const loadUrl = useCallback((url: string) => {
    const safeUrl = getSafeMainUrl(url);

    setLoading(true);
    lastSafeUrlRef.current = safeUrl;
    currentUrlRef.current = safeUrl;
    setMainUrl(safeUrl);
  }, []);

  const closeVideo = useCallback(() => {
    const safeUrl = getSafeMainUrl(lastSafeUrlRef.current || PROFILE_URL);

    setLoading(true);
    currentUrlRef.current = safeUrl;
    setMainUrl(safeUrl);
  }, []);

  const goBack = useCallback(() => {
    router.replace("/" as any);
  }, [router]);

  const handleNavigationRequest = useCallback(
    (request: any) => {
      const url: string = request?.url || "";

      if (isBlockedNativeUrl(url)) {
        return false;
      }

      if (isDiscoverOrFeedUrl(url)) {
        loadUrl(PROFILE_URL);
        return false;
      }

      if (!isAllowedWebUrl(url)) {
        return false;
      }

      return true;
    },
    [loadUrl],
  );

  const handleNavigationChange = useCallback(
    (navState: WebViewNavigation) => {
      const url: string = navState.url || "";

      currentUrlRef.current = url;
      setCanGoBack(navState.canGoBack);

      if (isDiscoverOrFeedUrl(url)) {
        webViewRef.current?.stopLoading();
        loadUrl(PROFILE_URL);
        return;
      }

      if (
        !isTikTokVideoUrl(url) &&
        isAllowedWebUrl(url) &&
        !url.startsWith("about:")
      ) {
        lastSafeUrlRef.current = getSafeMainUrl(url);
      }
    },
    [loadUrl],
  );

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event?.nativeEvent?.data || "{}");

        if (data?.type === "CLOSE_VIDEO") {
          closeVideo();
          return;
        }

        const url = data?.url || data?.payload?.url;

        if (
          url &&
          !isTikTokVideoUrl(url) &&
          isAllowedWebUrl(url) &&
          !url.startsWith("about:") &&
          !isDiscoverOrFeedUrl(url)
        ) {
          lastSafeUrlRef.current = getSafeMainUrl(url);
        }
      } catch {
        // ignore bad messages
      }
    },
    [closeVideo],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={goBack}
          style={styles.headerButton}
        >
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>TikTok</Text>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => webViewRef.current?.reload()}
          style={styles.headerButton}
        >
          <Ionicons name="reload" size={21} color="#fff" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.webContainer,
          { width: screenWidth, maxHeight: screenHeight },
        ]}
      >
        <WebView
          ref={webViewRef}
          source={source}
          style={styles.webView}
          containerStyle={styles.webView}
          userAgent={DESKTOP_USER_AGENT}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          incognito={false}
          cacheEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          allowsFullscreenVideo={false}
          bounces={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          androidLayerType="hardware"
          setBuiltInZoomControls={false}
          setDisplayZoomControls={false}
          textZoom={100}
          pullToRefreshEnabled={false}
          javaScriptCanOpenWindowsAutomatically
          setSupportMultipleWindows
          keyboardDisplayRequiresUserAction={false}
          hideKeyboardAccessoryView={false}
          originWhitelist={["https://*", "http://*", "about:*", "data:*"]}
          onShouldStartLoadWithRequest={handleNavigationRequest}
          onNavigationStateChange={handleNavigationChange}
          onMessage={handleMessage}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => {
            setLoading(false);
            webViewRef.current?.injectJavaScript(injectedJavaScript);
          }}
          onError={() => setLoading(false)}
          onHttpError={() => setLoading(false)}
          onContentProcessDidTerminate={() => webViewRef.current?.reload()}
        />

        {loading && (
          <View pointerEvents="none" style={styles.loadingOverlay}>
            <ActivityIndicator color="#fff" size="large" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    height: 54,
    backgroundColor: "#000",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#1d1d1d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
  webContainer: {
    flex: 1,
    backgroundColor: "#000",
    overflow: "hidden",
  },
  webView: {
    flex: 1,
    width: "100%",
    minWidth: 0,
    backgroundColor: "#000",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});

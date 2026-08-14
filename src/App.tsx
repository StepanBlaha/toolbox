import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { RevealReadyProvider } from "./context/RevealReadyContext";
import { useTheme } from "./hooks/useTheme";
import { tools } from "./data/tools";
import Preloader from "./components/Preloader/Preloader";
import GridFrame from "./components/GridFrame/GridFrame";
import Cursor from "./components/Cursor/Cursor";
import TopNav from "./components/TopNav/TopNav";
import { Landing } from "./pages/landing/Landing";
import { NotFound } from "./pages/not-found/NotFound";

// Tool pages are code-split so the initial load (and the heavy bg-remover ML
// model) is only fetched when a tool is actually opened.
const BoxShadow = lazy(() =>
  import("./pages/box-shadow/BoxShadow").then((m) => ({ default: m.BoxShadow }))
);
const Contrast = lazy(() => import("./pages/contrast/Contrast"));
const Gradient = lazy(() => import("./pages/gradient/Gradient"));
const BorderRadius = lazy(() => import("./pages/border-radius/BorderRadius"));
const Palette = lazy(() => import("./pages/palette/Palette"));
const BgRemover = lazy(() => import("./pages/bg-remover/BgRemover"));
const Grid = lazy(() => import("./pages/grid/Grid"));
const Flexbox = lazy(() => import("./pages/flexbox/Flexbox"));
const Easing = lazy(() => import("./pages/easing/Easing"));
const ColorConverter = lazy(() => import("./pages/color-converter/ColorConverter"));
const Filters = lazy(() => import("./pages/filters/Filters"));
const Waves = lazy(() => import("./pages/waves/Waves"));
const Blob = lazy(() => import("./pages/blob/Blob"));
const Glass = lazy(() => import("./pages/glass/Glass"));
const ClipPath = lazy(() => import("./pages/clip-path/ClipPath"));
const Neumorphism = lazy(() => import("./pages/neumorphism/Neumorphism"));
const TextShadow = lazy(() => import("./pages/text-shadow/TextShadow"));
const Keyframes = lazy(() => import("./pages/keyframes/Keyframes"));
const ColorPalette = lazy(() => import("./pages/color-palette/ColorPalette"));
const ImageCompressor = lazy(() => import("./pages/image-compressor/ImageCompressor"));
const Duotone = lazy(() => import("./pages/duotone/Duotone"));
const SvgEncoder = lazy(() => import("./pages/svg-encoder/SvgEncoder"));
const Scrollbar = lazy(() => import("./pages/scrollbar/Scrollbar"));
const UnitConverter = lazy(() => import("./pages/unit-converter/UnitConverter"));
const JsonFormatter = lazy(() => import("./pages/json-formatter/JsonFormatter"));
const QrCode = lazy(() => import("./pages/qr-code/QrCode"));
const Grainient = lazy(() => import("./pages/grainient/Grainient"));
const MeshGradient = lazy(() => import("./pages/mesh-gradient/MeshGradient"));
const NoiseTexture = lazy(() => import("./pages/noise/NoiseTexture"));
const Pattern = lazy(() => import("./pages/pattern/Pattern"));
const GradientText = lazy(() => import("./pages/gradient-text/GradientText"));
const GradientBorder = lazy(() => import("./pages/gradient-border/GradientBorder"));
const Loaders = lazy(() => import("./pages/loaders/Loaders"));
const Transform3D = lazy(() => import("./pages/transform-3d/Transform3D"));
const ShapeGen = lazy(() => import("./pages/shape/ShapeGen"));
const FontPairing = lazy(() => import("./pages/font-pairing/FontPairing"));
const TypeScale = lazy(() => import("./pages/type-scale/TypeScale"));
const Lorem = lazy(() => import("./pages/lorem/Lorem"));
const Uuid = lazy(() => import("./pages/uuid/Uuid"));
const Password = lazy(() => import("./pages/password/Password"));
const Hash = lazy(() => import("./pages/hash/Hash"));
const Base64 = lazy(() => import("./pages/base64/Base64"));
const Jwt = lazy(() => import("./pages/jwt/Jwt"));
const CaseConverter = lazy(() => import("./pages/case-converter/CaseConverter"));
const Regex = lazy(() => import("./pages/regex/Regex"));
const FaviconGen = lazy(() => import("./pages/favicon/FaviconGen"));
const OgImage = lazy(() => import("./pages/og-image/OgImage"));
const DiffChecker = lazy(() => import("./pages/diff/DiffChecker"));
const Cron = lazy(() => import("./pages/cron/Cron"));
const Timestamp = lazy(() => import("./pages/timestamp/Timestamp"));
const BaseConverter = lazy(() => import("./pages/base-converter/BaseConverter"));
const MetaTags = lazy(() => import("./pages/meta-tags/MetaTags"));
const UrlTool = lazy(() => import("./pages/url-tool/UrlTool"));
const TextStats = lazy(() => import("./pages/text-stats/TextStats"));
const Aes = lazy(() => import("./pages/aes/Aes"));
const AsciiArt = lazy(() => import("./pages/ascii-art/AsciiArt"));
const Dither = lazy(() => import("./pages/dither/Dither"));
const DesignTokens = lazy(() => import("./pages/design-tokens/DesignTokens"));
const TextStroke = lazy(() => import("./pages/text-stroke/TextStroke"));
const Bento = lazy(() => import("./pages/bento/Bento"));
const AsciiBanner = lazy(() => import("./pages/ascii-banner/AsciiBanner"));
const ImageEffects = lazy(() => import("./pages/image-effects/ImageEffects"));
const MaskedText = lazy(() => import("./pages/masked-text/MaskedText"));
const QrLogo = lazy(() => import("./pages/qr-logo/QrLogo"));
const NowPlaying = lazy(() => import("./pages/now-playing/NowPlaying"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        color: "var(--fg-faint)",
        fontFamily: "var(--mono)",
        fontSize: 13,
      }}
    >
      Loading…
    </div>
  );
}

const SITE_TITLE = "toolbox - design & dev utilities";
const SITE_URL = "https://toolbox.stepanblaha.com";
const SITE_DESC =
  "A collection of 60+ design and developer utilities - CSS generators, color tools, image tools, and IT utilities. Fast, free, and fully client-side.";

// Keep <head> tags in sync on client-side navigation (scrapers get the correct
// values from prerendered per-route HTML; this handles in-app route changes).
function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = document.createElement(selector.startsWith("link") ? "link" : "meta");
    const m = selector.match(/\[(name|property|rel)="([^"]+)"\]/);
    if (m) el.setAttribute(m[1], m[2]);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

function usePageSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const tool = tools.find((t) => t.path === pathname);
    const isHome = pathname === "/";
    const title = isHome
      ? SITE_TITLE
      : tool
        ? `${tool.name} · toolbox`
        : "Page not found · toolbox";
    const desc = isHome ? SITE_DESC : tool ? tool.description : SITE_DESC;
    const url = SITE_URL + (isHome ? "/" : pathname);

    document.title = title;
    setMeta('meta[name="description"]', "content", desc);
    setMeta('link[rel="canonical"]', "href", url);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", desc);
  }, [pathname]);
}

function App() {
  const { theme, toggle } = useTheme();
  const [ready, setReady] = useState(false);
  usePageSeo();

  return (
    <RevealReadyProvider ready={ready}>
      <Preloader onDone={() => setReady(true)} />
      <GridFrame />
      <Cursor />
      <TopNav theme={theme} onToggle={toggle} />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/tools/box-shadow" element={<BoxShadow />} />
          <Route path="/tools/contrast" element={<Contrast />} />
          <Route path="/tools/gradient" element={<Gradient />} />
          <Route path="/tools/border-radius" element={<BorderRadius />} />
          <Route path="/tools/palette" element={<Palette />} />
          <Route path="/tools/bg-remover" element={<BgRemover />} />
          <Route path="/tools/grid" element={<Grid />} />
          <Route path="/tools/flexbox" element={<Flexbox />} />
          <Route path="/tools/easing" element={<Easing />} />
          <Route path="/tools/color-converter" element={<ColorConverter />} />
          <Route path="/tools/filters" element={<Filters />} />
          <Route path="/tools/waves" element={<Waves />} />
          <Route path="/tools/blob" element={<Blob />} />
          <Route path="/tools/glass" element={<Glass />} />
          <Route path="/tools/clip-path" element={<ClipPath />} />
          <Route path="/tools/neumorphism" element={<Neumorphism />} />
          <Route path="/tools/text-shadow" element={<TextShadow />} />
          <Route path="/tools/keyframes" element={<Keyframes />} />
          <Route path="/tools/color-palette" element={<ColorPalette />} />
          <Route path="/tools/image-compressor" element={<ImageCompressor />} />
          <Route path="/tools/duotone" element={<Duotone />} />
          <Route path="/tools/svg-encoder" element={<SvgEncoder />} />
          <Route path="/tools/scrollbar" element={<Scrollbar />} />
          <Route path="/tools/unit-converter" element={<UnitConverter />} />
          <Route path="/tools/json-formatter" element={<JsonFormatter />} />
          <Route path="/tools/qr-code" element={<QrCode />} />
          <Route path="/tools/grainient" element={<Grainient />} />
          <Route path="/tools/mesh-gradient" element={<MeshGradient />} />
          <Route path="/tools/noise" element={<NoiseTexture />} />
          <Route path="/tools/pattern" element={<Pattern />} />
          <Route path="/tools/gradient-text" element={<GradientText />} />
          <Route path="/tools/gradient-border" element={<GradientBorder />} />
          <Route path="/tools/loaders" element={<Loaders />} />
          <Route path="/tools/transform-3d" element={<Transform3D />} />
          <Route path="/tools/shape" element={<ShapeGen />} />
          <Route path="/tools/font-pairing" element={<FontPairing />} />
          <Route path="/tools/type-scale" element={<TypeScale />} />
          <Route path="/tools/lorem" element={<Lorem />} />
          <Route path="/tools/uuid" element={<Uuid />} />
          <Route path="/tools/password" element={<Password />} />
          <Route path="/tools/hash" element={<Hash />} />
          <Route path="/tools/base64" element={<Base64 />} />
          <Route path="/tools/jwt" element={<Jwt />} />
          <Route path="/tools/case-converter" element={<CaseConverter />} />
          <Route path="/tools/regex" element={<Regex />} />
          <Route path="/tools/favicon" element={<FaviconGen />} />
          <Route path="/tools/og-image" element={<OgImage />} />
          <Route path="/tools/diff" element={<DiffChecker />} />
          <Route path="/tools/cron" element={<Cron />} />
          <Route path="/tools/timestamp" element={<Timestamp />} />
          <Route path="/tools/base-converter" element={<BaseConverter />} />
          <Route path="/tools/meta-tags" element={<MetaTags />} />
          <Route path="/tools/url-tool" element={<UrlTool />} />
          <Route path="/tools/text-stats" element={<TextStats />} />
          <Route path="/tools/aes" element={<Aes />} />
          <Route path="/tools/ascii-art" element={<AsciiArt />} />
          <Route path="/tools/dither" element={<Dither />} />
          <Route path="/tools/design-tokens" element={<DesignTokens />} />
          <Route path="/tools/text-stroke" element={<TextStroke />} />
          <Route path="/tools/bento" element={<Bento />} />
          <Route path="/tools/ascii-banner" element={<AsciiBanner />} />
          <Route path="/tools/image-effects" element={<ImageEffects />} />
          <Route path="/tools/masked-text" element={<MaskedText />} />
          <Route path="/tools/qr-logo" element={<QrLogo />} />
          <Route path="/tools/now-playing" element={<NowPlaying />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RevealReadyProvider>
  );
}

export default App;

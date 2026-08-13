import { lazy, Suspense, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RevealReadyProvider } from "./context/RevealReadyContext";
import { useTheme } from "./hooks/useTheme";
import Preloader from "./components/Preloader/Preloader";
import GridFrame from "./components/GridFrame/GridFrame";
import Cursor from "./components/Cursor/Cursor";
import TopNav from "./components/TopNav/TopNav";
import { Landing } from "./pages/landing/Landing";

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

function App() {
  const { theme, toggle } = useTheme();
  const [ready, setReady] = useState(false);

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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RevealReadyProvider>
  );
}

export default App;

// Data-driven CSS loader definitions. Each loader supplies its own HTML
// structure and a CSS builder so the exact same function can render the
// live preview (fed CSS custom properties) and the baked, copyable output
// (fed literal values) from a single source of truth.

export interface CssValues {
  size: string;
  color: string;
  speed: string;
  thickness: string;
}

export interface LoaderDef {
  id: string;
  label: string;
  usesThickness: boolean;
  html: string;
  buildCss: (v: CssValues, scope: string) => string;
}

function sel(scope: string, selector: string): string {
  return scope ? `${scope} ${selector}` : selector;
}

export const LOADERS: LoaderDef[] = [
  {
    id: "ring",
    label: "Ring Spinner",
    usesThickness: true,
    html: `<div class="loader"></div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  width: ${v.size};
  height: ${v.size};
  border-radius: 50%;
  border: ${v.thickness} solid color-mix(in oklab, ${v.color} 20%, transparent);
  border-top-color: ${v.color};
  animation: ring-spin ${v.speed} linear infinite;
}

@keyframes ring-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "dual-ring",
    label: "Dual Ring",
    usesThickness: true,
    html: `<div class="loader"></div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  position: relative;
  width: ${v.size};
  height: ${v.size};
}

${sel(scope, ".loader")}::before,
${sel(scope, ".loader")}::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: ${v.thickness} solid transparent;
}

${sel(scope, ".loader")}::before {
  border-top-color: ${v.color};
  animation: dual-ring-spin ${v.speed} linear infinite;
}

${sel(scope, ".loader")}::after {
  inset: calc(${v.thickness} * 2.5);
  border-bottom-color: ${v.color};
  animation: dual-ring-spin ${v.speed} linear infinite reverse;
}

@keyframes dual-ring-spin {
  to { transform: rotate(360deg); }
}`,
  },
  {
    id: "dots",
    label: "Dots",
    usesThickness: false,
    html: `<div class="loader">
  <span></span>
  <span></span>
  <span></span>
</div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  display: flex;
  align-items: center;
  gap: calc(${v.size} * 0.4);
}

${sel(scope, ".loader span")} {
  width: ${v.size};
  height: ${v.size};
  border-radius: 50%;
  background: ${v.color};
  animation: dots-bounce ${v.speed} ease-in-out infinite;
}

${sel(scope, ".loader span:nth-child(2)")} {
  animation-delay: calc(${v.speed} * 0.15);
}

${sel(scope, ".loader span:nth-child(3)")} {
  animation-delay: calc(${v.speed} * 0.3);
}

@keyframes dots-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}`,
  },
  {
    id: "bars",
    label: "Bars",
    usesThickness: false,
    html: `<div class="loader">
  <span></span>
  <span></span>
  <span></span>
  <span></span>
</div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  display: flex;
  align-items: flex-end;
  gap: calc(${v.size} * 0.3);
  height: calc(${v.size} * 2);
}

${sel(scope, ".loader span")} {
  width: calc(${v.size} * 0.3);
  height: 100%;
  border-radius: 2px;
  background: ${v.color};
  animation: bars-scale ${v.speed} ease-in-out infinite;
}

${sel(scope, ".loader span:nth-child(2)")} {
  animation-delay: calc(${v.speed} * 0.1);
}

${sel(scope, ".loader span:nth-child(3)")} {
  animation-delay: calc(${v.speed} * 0.2);
}

${sel(scope, ".loader span:nth-child(4)")} {
  animation-delay: calc(${v.speed} * 0.3);
}

@keyframes bars-scale {
  0%, 100% { transform: scaleY(0.3); }
  50% { transform: scaleY(1); }
}`,
  },
  {
    id: "pulse",
    label: "Pulse",
    usesThickness: false,
    html: `<div class="loader"></div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  width: ${v.size};
  height: ${v.size};
  border-radius: 50%;
  background: ${v.color};
  animation: pulse-fade ${v.speed} ease-in-out infinite;
}

@keyframes pulse-fade {
  0% { transform: scale(0.75); opacity: 1; }
  100% { transform: scale(1.4); opacity: 0; }
}`,
  },
  {
    id: "border-spinner",
    label: "Border Spinner",
    usesThickness: true,
    html: `<div class="loader"></div>`,
    buildCss: (v, scope) => `${sel(scope, ".loader")} {
  width: ${v.size};
  height: ${v.size};
  border-radius: 50%;
  background: conic-gradient(${v.color} 0deg 270deg, transparent 270deg 360deg);
  -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - ${v.thickness}), #000 calc(100% - ${v.thickness}));
  mask: radial-gradient(farthest-side, transparent calc(100% - ${v.thickness}), #000 calc(100% - ${v.thickness}));
  animation: border-spin ${v.speed} linear infinite;
}

@keyframes border-spin {
  to { transform: rotate(360deg); }
}`,
  },
];

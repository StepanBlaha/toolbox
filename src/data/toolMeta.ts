export interface ToolMeta {
  about: string;
  related: string[];
  alternatives: { label: string; url: string }[];
}

export const toolMeta: Record<string, ToolMeta> = {
  "box-shadow": {
    about:
      "A visual editor for building layered CSS box-shadow values and copying the generated code.",
    related: ["text-shadow", "gradient-border", "neumorphism"],
    alternatives: [
      { label: "CSSmatic", url: "https://www.cssmatic.com/box-shadow" },
      { label: "CSS Scan", url: "https://getcssscan.com/css-box-shadow-examples" },
    ],
  },
  contrast: {
    about:
      "Checks the WCAG contrast ratio between a foreground and background color for accessible text.",
    related: ["color-converter", "color-palette", "design-tokens"],
    alternatives: [
      { label: "WebAIM Contrast", url: "https://webaim.org/resources/contrastchecker/" },
      { label: "Coolors Contrast", url: "https://coolors.co/contrast-checker" },
    ],
  },
  "bg-remover": {
    about:
      "Removes the background from an image entirely in the browser, with no upload to a server.",
    related: ["image-compressor", "image-effects", "duotone"],
    alternatives: [
      { label: "remove.bg", url: "https://www.remove.bg" },
      { label: "Photopea", url: "https://www.photopea.com" },
    ],
  },
  gradient: {
    about: "Builds CSS linear and radial gradients visually and copies the resulting code.",
    related: ["grainient", "mesh-gradient", "gradient-text"],
    alternatives: [
      { label: "CSS Gradient", url: "https://cssgradient.io" },
      { label: "ColorZilla", url: "https://www.colorzilla.com/gradient-editor/" },
    ],
  },
  palette: {
    about: "Extracts a dominant color palette from any uploaded image.",
    related: ["color-palette", "design-tokens", "duotone"],
    alternatives: [
      { label: "Coolors Image Picker", url: "https://coolors.co/image-picker" },
      { label: "Image Color Picker", url: "https://imagecolorpicker.com" },
    ],
  },
  "border-radius": {
    about: "Lets you visually tune each corner's border-radius and copy the CSS.",
    related: ["box-shadow", "clip-path", "neumorphism"],
    alternatives: [
      { label: "Fancy Border Radius", url: "https://9elements.github.io/fancy-border-radius/" },
      { label: "border-radius.com", url: "https://border-radius.com" },
    ],
  },
  grid: {
    about: "Builds CSS Grid layouts with a visual editor and exports the generated code.",
    related: ["flexbox", "bento"],
    alternatives: [
      { label: "CSS Grid Generator", url: "https://cssgrid-generator.netlify.app" },
      { label: "Layoutit Grid", url: "https://grid.layoutit.com" },
    ],
  },
  flexbox: {
    about: "An interactive playground for experimenting with flexbox alignment and sizing.",
    related: ["grid", "bento"],
    alternatives: [
      { label: "Flexy Boxes", url: "https://the-echoplex.net/flexyboxes/" },
      { label: "Flexbox Froggy", url: "https://flexboxfroggy.com" },
    ],
  },
  easing: {
    about: "Designs custom cubic-bezier easing curves with a live motion preview.",
    related: ["keyframes", "transform-3d"],
    alternatives: [
      { label: "cubic-bezier.com", url: "https://cubic-bezier.com" },
      { label: "Easings.net", url: "https://easings.net" },
    ],
  },
  "color-converter": {
    about: "Converts colors between HEX, RGB, HSL and OKLCH formats.",
    related: ["contrast", "color-palette", "palette"],
    alternatives: [
      { label: "W3Schools", url: "https://www.w3schools.com/colors/colors_converter.asp" },
      { label: "ColorDesigner", url: "https://colordesigner.io/convert" },
    ],
  },
  filters: {
    about: "Applies and previews CSS filter effects like blur, contrast and hue-rotate on an image.",
    related: ["duotone", "image-effects", "dither"],
    alternatives: [
      { label: "CSS Filter Generator", url: "https://www.cssfiltergenerator.com" },
      { label: "html-css-js", url: "https://html-css-js.com/css/generator/filter/" },
    ],
  },
  waves: {
    about: "Generates layered SVG wave shapes for section dividers and exports the markup.",
    related: ["blob", "shape"],
    alternatives: [
      { label: "Get Waves", url: "https://getwaves.io" },
      { label: "Shape Divider", url: "https://www.shapedivider.app" },
    ],
  },
  blob: {
    about: "Creates organic, randomized SVG blob shapes for backgrounds and illustrations.",
    related: ["waves", "shape"],
    alternatives: [
      { label: "Blobmaker", url: "https://www.blobmaker.app" },
      { label: "Haikei", url: "https://haikei.app" },
    ],
  },
  glass: {
    about: "Designs frosted glassmorphism cards with adjustable blur, tint and border.",
    related: ["neumorphism", "gradient-border"],
    alternatives: [
      { label: "Hype4 Glassmorphism", url: "https://hype4.academy/tools/glassmorphism-generator" },
      { label: "Glassmorphism", url: "https://glassmorphism.com" },
    ],
  },
  "clip-path": {
    about: "Crafts CSS clip-path polygons and shapes with a visual point editor.",
    related: ["shape", "border-radius"],
    alternatives: [
      { label: "Clippy", url: "https://bennettfeely.com/clippy/" },
      { label: "CSSPortal", url: "https://www.cssportal.com/css-clip-path-generator/" },
    ],
  },
  neumorphism: {
    about: "Generates soft neumorphic shadow pairs for light and dark surfaces.",
    related: ["glass", "box-shadow"],
    alternatives: [{ label: "Neumorphism.io", url: "https://neumorphism.io" }],
  },
  "text-shadow": {
    about: "Layers multiple CSS text-shadow values with a live preview and copies the code.",
    related: ["box-shadow", "text-stroke", "gradient-text"],
    alternatives: [
      { label: "CSS Generator", url: "https://cssgenerator.org/text-shadow-css-generator.html" },
      { label: "html-css-js", url: "https://html-css-js.com/css/generator/text-shadow/" },
    ],
  },
  keyframes: {
    about: "Builds CSS @keyframes animations from presets with live playback.",
    related: ["easing", "loaders", "transform-3d"],
    alternatives: [
      { label: "Animista", url: "https://animista.net" },
      { label: "webcode.tools", url: "https://webcode.tools/css-generators/keyframes" },
    ],
  },
  "color-palette": {
    about: "Generates harmonious color palettes from a single base color.",
    related: ["palette", "design-tokens", "contrast"],
    alternatives: [
      { label: "Coolors", url: "https://coolors.co" },
      { label: "Adobe Color", url: "https://color.adobe.com" },
    ],
  },
  "image-compressor": {
    about: "Re-encodes and shrinks image files directly in the browser without uploading them.",
    related: ["bg-remover", "image-effects", "favicon"],
    alternatives: [
      { label: "TinyPNG", url: "https://tinypng.com" },
      { label: "Squoosh", url: "https://squoosh.app" },
    ],
  },
  duotone: {
    about: "Maps an image's tones onto a two-color duotone gradient.",
    related: ["filters", "dither", "image-effects"],
    alternatives: [
      { label: "Photopea", url: "https://www.photopea.com" },
      { label: "Pixlr", url: "https://pixlr.com" },
    ],
  },
  "svg-encoder": {
    about: "Encodes SVG markup into a data URI ready to drop into a CSS background-image.",
    related: ["waves", "blob", "pattern"],
    alternatives: [
      { label: "URL-encoder for SVG", url: "https://yoksel.github.io/url-encoder/" },
      { label: "SVG Backgrounds", url: "https://www.svgbackgrounds.com" },
    ],
  },
  scrollbar: {
    about: "Styles custom scrollbar colors and sizing and copies the CSS.",
    related: ["glass", "box-shadow"],
    alternatives: [{ label: "CSS Scrollbar", url: "https://cssscrollbar.com" }],
  },
  "unit-converter": {
    about: "Converts CSS length units like px, rem, em, pt and percentages.",
    related: ["type-scale", "base-converter"],
    alternatives: [],
  },
  "json-formatter": {
    about: "Formats, minifies and validates JSON with error highlighting.",
    related: ["base64", "diff", "regex"],
    alternatives: [
      { label: "JSONFormatter.org", url: "https://jsonformatter.org" },
      { label: "JSONLint", url: "https://jsonlint.com" },
    ],
  },
  "qr-code": {
    about: "Generates downloadable QR codes from any text or URL.",
    related: ["qr-logo", "favicon"],
    alternatives: [
      { label: "QR Code Generator", url: "https://www.qr-code-generator.com" },
      { label: "QRCode Monkey", url: "https://www.qrcode-monkey.com" },
    ],
  },
  "qr-logo": {
    about: "Generates a QR code with a custom logo embedded in the center.",
    related: ["qr-code", "favicon"],
    alternatives: [
      { label: "QRCode Monkey", url: "https://www.qrcode-monkey.com" },
      { label: "QR.io", url: "https://qr.io" },
    ],
  },
  grainient: {
    about: "Combines a CSS gradient with a film-grain noise overlay for a textured background.",
    related: ["gradient", "noise", "mesh-gradient"],
    alternatives: [
      { label: "Haikei", url: "https://haikei.app" },
      { label: "CSS-Tricks grainy", url: "https://css-tricks.com/grainy-gradients/" },
    ],
  },
  "mesh-gradient": {
    about: "Layers soft radial color blobs into a smooth mesh gradient background.",
    related: ["gradient", "grainient", "noise"],
    alternatives: [
      { label: "Mesh Gradient", url: "https://meshgradient.com" },
      { label: "MagicPattern", url: "https://www.magicpattern.design/tools/mesh-gradients" },
    ],
  },
  noise: {
    about: "Generates seamless SVG grain and noise textures for CSS backgrounds.",
    related: ["grainient", "pattern", "mesh-gradient"],
    alternatives: [
      { label: "fffuel nnnoise", url: "https://www.fffuel.co/nnnoise/" },
      { label: "CSS-Tricks grainy", url: "https://css-tricks.com/grainy-gradients/" },
    ],
  },
  pattern: {
    about: "Generates pure-CSS stripes, dots, grids and other repeating background patterns.",
    related: ["noise", "svg-encoder"],
    alternatives: [
      { label: "CSS Pattern", url: "https://css-pattern.com" },
      { label: "Hero Patterns", url: "https://heropatterns.com" },
    ],
  },
  "gradient-text": {
    about: "Clips a CSS gradient into text and copies the resulting styles.",
    related: ["gradient", "text-shadow", "text-stroke"],
    alternatives: [{ label: "CSS Gradient", url: "https://cssgradient.io" }],
  },
  "gradient-border": {
    about: "Builds rounded boxes with animated or static gradient borders.",
    related: ["gradient", "glass", "box-shadow"],
    alternatives: [{ label: "CSS Gradient", url: "https://cssgradient.io" }],
  },
  loaders: {
    about: "A gallery of animated CSS spinners and loaders ready to copy.",
    related: ["keyframes", "easing"],
    alternatives: [
      { label: "Loading.io", url: "https://loading.io" },
      { label: "CSS Loaders", url: "https://css-loaders.com" },
    ],
  },
  "transform-3d": {
    about: "Experiment with CSS perspective and 3D rotation transforms interactively.",
    related: ["easing", "keyframes"],
    alternatives: [{ label: "CSS Transform", url: "https://css-transform.moro.es" }],
  },
  shape: {
    about: "Generates triangles and other common CSS shapes to copy directly.",
    related: ["clip-path", "blob", "waves"],
    alternatives: [
      { label: "Clippy", url: "https://bennettfeely.com/clippy/" },
      { label: "CSS-Tricks Shapes", url: "https://css-tricks.com/the-shapes-of-css/" },
    ],
  },
  "font-pairing": {
    about: "Curated Google Fonts heading and body pairings for quick typography choices.",
    related: ["type-scale", "design-tokens"],
    alternatives: [
      { label: "Fontpair", url: "https://www.fontpair.co" },
      { label: "Google Fonts", url: "https://fonts.google.com" },
    ],
  },
  "type-scale": {
    about: "Builds a modular typographic scale and exports it as CSS custom properties.",
    related: ["font-pairing", "design-tokens", "unit-converter"],
    alternatives: [
      { label: "Typescale", url: "https://typescale.com" },
      { label: "Modular Scale", url: "https://www.modularscale.com" },
    ],
  },
  lorem: {
    about: "Generates placeholder Lorem Ipsum text in words, sentences or paragraphs.",
    related: ["text-stats", "case-converter"],
    alternatives: [
      { label: "Lorem Ipsum", url: "https://www.lipsum.com" },
      { label: "Loremipsum.io", url: "https://loremipsum.io" },
    ],
  },
  uuid: {
    about: "Generates RFC 4122 v4 UUIDs individually or in bulk.",
    related: ["password", "hash"],
    alternatives: [
      { label: "UUID Generator", url: "https://www.uuidgenerator.net" },
      { label: "IT Tools", url: "https://it-tools.tech/uuid-generator" },
    ],
  },
  password: {
    about: "Generates secure random passwords with a configurable strength meter.",
    related: ["uuid", "hash"],
    alternatives: [
      { label: "1Password", url: "https://1password.com/password-generator" },
      { label: "Bitwarden", url: "https://bitwarden.com/password-generator/" },
    ],
  },
  hash: {
    about: "Computes SHA-1, SHA-256, SHA-384 and SHA-512 hashes of any text.",
    related: ["base64", "aes", "uuid"],
    alternatives: [
      { label: "emn178 online tools", url: "https://emn178.github.io/online-tools/" },
      { label: "CyberChef", url: "https://gchq.github.io/CyberChef/" },
    ],
  },
  base64: {
    about: "Encodes and decodes text or files to and from Base64.",
    related: ["hash", "json-formatter", "url-tool"],
    alternatives: [
      { label: "Base64Encode", url: "https://www.base64encode.org" },
      { label: "Base64Decode", url: "https://www.base64decode.org" },
    ],
  },
  jwt: {
    about: "Decodes a JWT's header, payload and expiry without sending it anywhere.",
    related: ["base64", "hash"],
    alternatives: [
      { label: "JWT.io", url: "https://jwt.io" },
      { label: "JWT.ms", url: "https://jwt.ms" },
    ],
  },
  "case-converter": {
    about: "Converts text between camelCase, snake_case, kebab-case and more.",
    related: ["text-stats", "lorem"],
    alternatives: [],
  },
  regex: {
    about: "Tests regular expressions against sample text with live match highlighting.",
    related: ["diff", "json-formatter"],
    alternatives: [
      { label: "Regex101", url: "https://regex101.com" },
      { label: "RegExr", url: "https://regexr.com" },
    ],
  },
  favicon: {
    about: "Builds a favicon set from text or an emoji, exported at every required size.",
    related: ["og-image", "qr-code"],
    alternatives: [
      { label: "RealFaviconGenerator", url: "https://realfavicongenerator.net" },
      { label: "favicon.io", url: "https://favicon.io" },
    ],
  },
  "og-image": {
    about: "Designs 1200x630 Open Graph images for social link previews.",
    related: ["favicon", "meta-tags"],
    alternatives: [
      { label: "OpenGraph.xyz", url: "https://www.opengraph.xyz" },
      { label: "Metatags.io", url: "https://metatags.io" },
    ],
  },
  diff: {
    about: "Compares two blocks of text and highlights the line-by-line differences.",
    related: ["json-formatter", "regex"],
    alternatives: [
      { label: "Diffchecker", url: "https://www.diffchecker.com" },
      { label: "Text Compare", url: "https://text-compare.com" },
    ],
  },
  cron: {
    about: "Builds, explains and previews upcoming run times for cron schedule expressions.",
    related: ["timestamp", "base-converter"],
    alternatives: [
      { label: "Crontab.guru", url: "https://crontab.guru" },
      { label: "Cron Generator", url: "https://crontab-generator.org" },
    ],
  },
  timestamp: {
    about: "Converts Unix timestamps to human-readable dates and back.",
    related: ["cron", "base-converter"],
    alternatives: [
      { label: "Epoch Converter", url: "https://www.epochconverter.com" },
      { label: "Unix Timestamp", url: "https://www.unixtimestamp.com" },
    ],
  },
  "base-converter": {
    about: "Converts whole numbers between bases 2 through 36.",
    related: ["unit-converter", "timestamp"],
    alternatives: [
      { label: "RapidTables", url: "https://www.rapidtables.com/convert/number/base-converter.html" },
      { label: "IT Tools", url: "https://it-tools.tech" },
    ],
  },
  "meta-tags": {
    about: "Generates SEO and Open Graph meta tags ready to paste into a page head.",
    related: ["og-image", "favicon"],
    alternatives: [
      { label: "Metatags.io", url: "https://metatags.io" },
      { label: "OpenGraph.xyz", url: "https://www.opengraph.xyz" },
    ],
  },
  "url-tool": {
    about: "Encodes, decodes and parses URLs into their component parts.",
    related: ["base64", "json-formatter"],
    alternatives: [
      { label: "URL Encoder", url: "https://www.urlencoder.org" },
      { label: "Meyerweb dencoder", url: "https://meyerweb.com/eric/tools/dencoder/" },
    ],
  },
  "text-stats": {
    about: "Counts words and characters and estimates readability scores for a block of text.",
    related: ["lorem", "case-converter"],
    alternatives: [
      { label: "WordCounter", url: "https://wordcounter.net" },
      { label: "Character Count", url: "https://charactercountonline.com" },
    ],
  },
  aes: {
    about: "Encrypts and decrypts text with a passphrase using AES.",
    related: ["hash", "base64"],
    alternatives: [
      { label: "Devglan AES", url: "https://www.devglan.com/online-tools/aes-encryption-decryption" },
      { label: "CyberChef", url: "https://gchq.github.io/CyberChef/" },
    ],
  },
  "ascii-art": {
    about: "Converts an uploaded image into ASCII-character art.",
    related: ["ascii-banner", "dither"],
    alternatives: [
      { label: "text-image.com", url: "https://www.text-image.com" },
      { label: "ManyTools", url: "https://manytools.org/hacker-tools/convert-images-to-ascii-art/" },
    ],
  },
  dither: {
    about: "Dithers and restyles images with retro, limited-color palettes.",
    related: ["ascii-art", "duotone", "image-effects"],
    alternatives: [
      { label: "Dither it!", url: "https://ditherit.com" },
      { label: "Dither Me This", url: "https://doodad.dev/dither-me-this" },
    ],
  },
  "design-tokens": {
    about: "Generates a matched set of color, spacing and type-scale design tokens.",
    related: ["color-palette", "type-scale", "font-pairing"],
    alternatives: [
      { label: "UI Colors", url: "https://uicolors.app" },
      { label: "Tailwind Shades", url: "https://www.tailwindshades.com" },
    ],
  },
  "text-stroke": {
    about: "Outlines text with an adjustable CSS stroke and copies the code.",
    related: ["text-shadow", "gradient-text"],
    alternatives: [{ label: "CSSPortal", url: "https://www.cssportal.com/css-text-stroke/" }],
  },
  bento: {
    about: "Designs asymmetric bento-box style grid layouts and exports the CSS.",
    related: ["grid", "flexbox"],
    alternatives: [{ label: "Layoutit Grid", url: "https://grid.layoutit.com" }],
  },
  "ascii-banner": {
    about: "Turns text into large ASCII-art letter banners.",
    related: ["ascii-art", "lorem"],
    alternatives: [
      { label: "TAAG", url: "https://patorjk.com/software/taag/" },
      { label: "ASCII Art", url: "https://www.asciiart.eu/text-to-ascii-art" },
    ],
  },
  "image-effects": {
    about: "Applies halftone, glitch, low-poly and other stylized effects to an image.",
    related: ["duotone", "dither", "filters"],
    alternatives: [
      { label: "Photopea", url: "https://www.photopea.com" },
      { label: "Pixlr", url: "https://pixlr.com" },
    ],
  },
  "masked-text": {
    about: "Clips an image or gradient inside large text using a CSS mask.",
    related: ["gradient-text", "text-stroke"],
    alternatives: [{ label: "Photopea", url: "https://www.photopea.com" }],
  },
  "now-playing": {
    about: "Designs a shareable, customizable music now-playing card image.",
    related: ["og-image", "favicon"],
    alternatives: [],
  },
};

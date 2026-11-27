import { PNG } from "pngjs";

const harmonies = [
  { name: "Monochromatic", offsets: [0] },
  { name: "Analogous", offsets: [0, 30, 60] },
  { name: "Complementary", offsets: [0, 180] },
  { name: "Split-complementary", offsets: [0, 150, 210] },
  { name: "Triadic", offsets: [0, 120, 240] },
];

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [r, g, b] =
    hue < 60
      ? [chroma, x, 0]
      : hue < 120
        ? [x, chroma, 0]
        : hue < 180
          ? [0, chroma, x]
          : hue < 240
            ? [0, x, chroma]
            : hue < 300
              ? [x, 0, chroma]
              : [chroma, 0, x];
  return `#${[r, g, b]
    .map((channel) =>
      Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
}

export function generatePalette(count: number): {
  harmony: string;
  colors: string[];
} {
  if (!Number.isInteger(count) || count < 2 || count > 8) {
    throw new RangeError("Palette size must be an integer from 2 to 8.");
  }
  const choices = harmonies.filter(
    (harmony) => harmony.offsets.length <= count,
  );
  const harmony = choices[Math.floor(Math.random() * choices.length)];
  const hue = Math.floor(Math.random() * 360);
  const saturation = 50 + Math.floor(Math.random() * 31);
  const colors = Array.from({ length: count }, (_, index) =>
    hslToHex(
      (hue + harmony.offsets[index % harmony.offsets.length]) % 360,
      saturation,
      28 + (48 * index) / (count - 1),
    ),
  );
  return { harmony: harmony.name, colors };
}

export function renderPalette(colors: string[]): Buffer {
  const width = 800;
  const height = 160;
  const image = new PNG({ width, height });
  for (let x = 0; x < width; x++) {
    const color = colors[Math.floor((x * colors.length) / width)];
    const rgb = parseInt(color.slice(1), 16);
    for (let y = 0; y < height; y++) {
      const offset = (y * width + x) * 4;
      image.data[offset] = (rgb >> 16) & 255;
      image.data[offset + 1] = (rgb >> 8) & 255;
      image.data[offset + 2] = rgb & 255;
      image.data[offset + 3] = 255;
    }
  }
  return PNG.sync.write(image);
}

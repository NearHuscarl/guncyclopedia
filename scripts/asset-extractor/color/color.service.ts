import sum from "lodash/sum.js";
import Color from "color";
import type { ColorInstance } from "color";
import type { Sharp } from "sharp";

const MIN_DISTANCE_THRESHOLD = 80; // Lower than 80 can fuck up Tetrominator palette
const NEUTRAL_MIN_DISTANCE_THRESHOLD = 30;
const DOMINANT_MIN_WEIGHT = 0.1; // At least 10% of total color weight to be considered dominant

export class ColorService {
  colorDistance(c1: ColorInstance, c2: ColorInstance): number {
    const [r1, g1, b1] = c1.rgb().array();
    const [r2, g2, b2] = c2.rgb().array();
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
  }

  getClosestKnownColors(inputHex: string, colorLookup: Record<string, string[]>): string {
    const input = Color(inputHex);
    let closestColor = "";
    let minDistance = Infinity;

    for (const [name, hexArray] of Object.entries(colorLookup)) {
      for (const hex of hexArray) {
        const acceptableDistance =
          name === "black" || name === "white" || name === "gray"
            ? NEUTRAL_MIN_DISTANCE_THRESHOLD
            : MIN_DISTANCE_THRESHOLD;
        const dist = this.colorDistance(input, Color(hex));
        if (dist < minDistance && dist < acceptableDistance) {
          minDistance = dist;
          closestColor = name;
        }
      }
    }

    return closestColor;
  }

  async findDominantColors(image: Sharp, colorLookup: Record<string, string[]>) {
    const data = await image.clone().ensureAlpha().raw().toBuffer();
    const matchedColors: Record<string, number> = {};
    const closestColorLookup: Record<string, string> = {};

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (a === 0) continue; // skip transparent pixels

      closestColorLookup[`${r},${g},${b}`] ??= this.getClosestKnownColors(Color({ r, g, b }).hex(), colorLookup);
      const closestColor = closestColorLookup[`${r},${g},${b}`];

      if (!closestColor) continue;

      matchedColors[closestColor] = (matchedColors[closestColor] || 0) + 1;
    }

    const totalWeight = sum(Object.values(matchedColors));
    for (const [color, weight] of Object.entries(matchedColors)) {
      if (weight / totalWeight < DOMINANT_MIN_WEIGHT) {
        delete matchedColors[color];
      }
    }

    return Object.entries(matchedColors)
      .sort(([, a], [, b]) => b - a)
      .map(([color]) => color);
  }
}

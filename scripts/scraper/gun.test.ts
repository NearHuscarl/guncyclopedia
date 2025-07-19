import { describe, expect, test } from "vitest";
import { parseComplexAmmoCapacityText, parseComplexDpsText, parseComplexMagText } from "./gun";

describe("gun.ts", () => {
  describe("parseComplexDpsText()", () => {
    test(`should handle special case for a specific weapon: Crescent Crossbow`, () => {
      const text = "19.5 and up (Varies heavily due to nature of projectiles)";
      const result = parseComplexDpsText(text, "Crescent_Crossbow");
      expect(result).toEqual([
        {
          condition: "Varies heavily due to nature of projectiles",
          isMin: true,
          value: 19.5,
        },
      ]);
    });

    test(`should handle special case for a specific weapon: Turbo-Gun`, () => {
      const text = "32-80";
      const result = parseComplexDpsText(text, "Turbo-Gun");
      expect(result).toEqual([
        { condition: "Min", value: 32 },
        { condition: "Max", value: 80 },
      ]);
    });

    test("should parse text with pattern - value (condition)", () => {
      const text = `35 (no charge)
46.6 (1 charge)
50 (2 charges)
51.6 (3 charges)
93.3 (fully charged)`;

      const result = parseComplexDpsText(text, "SomeGun");
      expect(result).toEqual([
        { condition: "No Charge", value: 35 },
        { condition: "1 Charge", value: 46.6 },
        { condition: "2 Charges", value: 50 },
        { condition: "3 Charges", value: 51.6 },
        { condition: "Fully Charged", value: 93.3 },
      ]);
    });

    test("should parse text with pattern - Condition: value", () => {
      const text = `Uncharged: 37.5
Charged: 20`;

      const result = parseComplexDpsText(text, "Charmed_Bow");

      expect(result).toEqual([
        { condition: "Uncharged", value: 37.5 },
        { condition: "Charged", value: 20 },
      ]);
    });

    test("should parse text with complex pattern - Condition: value", () => {
      const text = `Level 1-19: 25.45
Level 20-29: 29.57
Level 30-39: 33.157
Level 40-49: 34.09
Level 50-59: 107.14
Level 60: 181.82`;

      const result = parseComplexDpsText(text, "SomeScalingGun");
      expect(result).toEqual([
        { condition: "Level 1-19", value: 25.45 },
        { condition: "Level 20-29", value: 29.57 },
        { condition: "Level 30-39", value: 33.157 },
        { condition: "Level 40-49", value: 34.09 },
        { condition: "Level 50-59", value: 107.14 },
        { condition: "Level 60", value: 181.82 },
      ]);
    });

    test("should parse simple value as well", () => {
      const text = `1000`;
      const result = parseComplexDpsText(text, "Random_Gun");

      expect(result).toEqual([{ condition: "Default", value: 1000 }]);
    });
  });

  describe("parseComplexMagText()", () => {
    test(`should handle special case for a specific weapon: Gilded Hydra`, () => {
      const text = "1+";
      const result = parseComplexMagText(text, "Gilded_Hydra");
      expect(result).toEqual([
        {
          condition: "Increased by 1 for each half heart missing",
          isMin: true,
          value: 1,
        },
      ]);
    });

    test(`should handle special case for a specific weapon: Triple Gun`, () => {
      const text = `9 (revolver)
32 (machine gun)
∞ (beam)`;
      const result = parseComplexMagText(text, "Triple_Gun");
      expect(result).toEqual([
        { condition: "Revolver", value: 9 },
        { condition: "Machine Gun", value: 32 },
        { condition: "Beam", value: 500 },
      ]);
    });

    test(`should handle special case for a specific weapon: Microtransaction Gun`, () => {
      const text = `9 (revolver)
32 (machine gun)
∞ (beam)`;
      const result = parseComplexMagText(text, "Microtransaction_Gun");
      expect(result).toEqual([{ condition: "Number of shells held", value: 0, isMin: true }]);
    });
  });

  describe("parseComplexAmmoCapacityText()", () => {
    test(`should handle special case for a specific weapon: Microtransaction Gun`, () => {
      const result = parseComplexAmmoCapacityText("Equal to Shells held", "Microtransaction_Gun");
      expect(result).toEqual([{ condition: "Number of shells held", value: 0, isMin: true }]);
    });
  });
});

import chalk from "chalk";
import startCase from "lodash/startCase.js";
import { type Page } from "playwright";
import { goToPage } from "./util.ts";

type TDamagePerSecond = {
  condition: string;
  value: number;
};

export interface IGunDto {
  id: string;
  name: string;
  image: string;
  quote: string;
  quality: string;
  type: string;
  dps: string;
}

export interface IGun {
  id: string;
  name: string;
  image: string;
  quote: string;
  quality: "S" | "A" | "B" | "C" | "D" | "N";
  type: "Semiautomatic" | "Charged" | "Burst" | "Automatic" | "Varies" | "Beam";
  dps: TDamagePerSecond[];
}

function unwrapParentheses(text: string): string {
  return text.replace(/\((.*)\)/, "$1");
}

export function parseComplexDpsText(
  text: string,
  gunId: string
): TDamagePerSecond[] {
  const parts = text.split("\n");
  const res: TDamagePerSecond[] = [];

  // Handle special cases for specific guns
  switch (gunId) {
    case "Crescent_Crossbow": {
      const [first, second] = text
        .split(/(\d+(?:\.\d+)?) and up/)
        .filter(Boolean);
      res.push({
        condition: unwrapParentheses(second.trim()),
        value: parseFloat(first.trim()),
      });
      return res;
    }
    case "Turbo-Gun": {
      const [min, max] = text.split("-").map((v) => parseFloat(v));
      return res.concat([
        { condition: "Min", value: min },
        { condition: "Max", value: max },
      ]);
    }
  }

  // Format example: `12.37 (hit once normal)`
  const isValueFirst = parts[0].endsWith(")");
  // Format example: `Uncharged: 37.5`
  const isConditionFirst = parts[0].match(/:\s*\d+(?:\.\d+)?$/);

  if (isValueFirst) {
    for (const part of parts) {
      const [first, second] = part.split(/^(\d+(?:\.\d+)?)/).filter(Boolean);
      res.push({
        condition: startCase(unwrapParentheses(second.trim())),
        value: parseFloat(first.trim()),
      });
    }
  } else if (isConditionFirst) {
    for (const part of parts) {
      const [first, second] = part.split(/^([^:]+):/).filter(Boolean);
      res.push({
        condition: first.trim(),
        value: parseFloat(second.trim()),
      });
    }
  } else {
    throw new Error(`Unknown DPS format of ${gunId}: ` + chalk.green(text));
  }

  return res;
}

async function parseDpsText(
  gunDto: IGunDto,
  page: Page
): Promise<TDamagePerSecond[]> {
  const dpsText = gunDto.dps;
  const isComplexDps = Number.isNaN(Number(dpsText)) && dpsText !== "?";

  if (!isComplexDps) {
    const dpsValue = Number.isNaN(parseFloat(dpsText))
      ? -1 // ?
      : parseFloat(dpsText);
    return [{ condition: "Default", value: dpsValue }];
  }

  const gunDetailPage = `https://enterthegungeon.fandom.com/wiki/${gunDto.id}`;
  console.log(
    chalk.grey(
      `Navigating to ${gunDetailPage} page to parse complex DPS text: "${chalk.bgGray(
        dpsText
      )}"`
    )
  );
  await page.goto(gunDetailPage, { waitUntil: "domcontentloaded" });

  const dpsDetailText = await page.$eval(
    'tr:has(td:first-child span[title^="Damage per second"]) td:nth-child(2)',
    (el: HTMLElement) => el.innerText?.trim() || ""
  );
  console.log(chalk.grey("> Parsing:"));
  console.log(chalk.magenta(dpsDetailText));

  const res = parseComplexDpsText(dpsDetailText, gunDto.id);
  console.log(chalk.yellow(JSON.stringify(res)));
  console.log();

  return res;
}

export async function getGuns() {
  const { browser, context, page } = await goToPage(
    "https://enterthegungeon.fandom.com/wiki/Guns"
  );

  const qualityMap = {
    "1S_Quality_Item.png": "S",
    "A_Quality_Item.png": "A",
    "B_Quality_Item.png": "B",
    "C_Quality_Item.png": "C",
    "D_Quality_Item.png": "D",
    "N_Quality_Item.png": "N",
  };

  const gunDtos = await page.$$eval(".wikitable tr", (rows) => {
    return rows
      .slice(1)
      .map((row) => {
        const cells = row.querySelectorAll("td");
        if (cells.length < 6) return null;

        const image =
          cells[0].querySelector("img")?.getAttribute("data-src") || "";
        const idHref = cells[1].querySelector("a")?.getAttribute("href") ?? "";
        const name = cells[1].textContent?.trim() || "";
        const quote = cells[3].textContent?.trim() || "";
        const qualityKey =
          cells[4].querySelector("img")?.getAttribute("data-image-key") || "";
        const type = cells[5].textContent?.trim() || "";
        const dps = cells[6].textContent?.trim() || "";

        const id = idHref.split("/").pop() || "";

        return {
          id,
          name,
          image,
          quote,
          quality: qualityKey,
          type,
          dps,
        };
      })
      .filter(Boolean) as IGunDto[];
  });

  const guns: IGun[] = [];
  for (const gunDto of gunDtos) {
    guns.push({
      ...gunDto,
      quality: qualityMap[gunDto.quality],
      type: gunDto.type as IGun["type"],
      dps: await parseDpsText(gunDto, page),
    });
  }

  const qualitySet = new Set(guns.map((gun) => gun.type));
  console.log(qualitySet);

  // Teardown
  await context.close();
  await browser.close();

  return guns;
}

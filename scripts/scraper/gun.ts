import chalk from "chalk";
import debug from "debug";
import startCase from "lodash/startCase.js";
import { type Page } from "playwright";
import { goToPage, unwrapParentheses } from "./util.ts";

const logStar = debug("gun:common");
const logDps = debug("gun:dps");
const logMag = debug("gun:mag");

type TDamagePerSecond = {
  condition: string;
  isMin?: boolean;
  value: number;
};
type TMagazineSize = {
  condition: string;
  isMin?: boolean;
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
  magazineSize: string;
}

export interface IGun {
  id: string;
  name: string;
  image: string;
  quote: string;
  quality: "S" | "A" | "B" | "C" | "D" | "N";
  type: "Semiautomatic" | "Charged" | "Burst" | "Automatic" | "Varies" | "Beam";
  dps: TDamagePerSecond[];
  magazineSize: TMagazineSize[];
}

export async function goToGunDetailPage(page: Page, gunId: string) {
  const gunDetailPage = `https://enterthegungeon.fandom.com/wiki/${gunId}`;
  logStar(chalk.grey(`Navigating to ${gunDetailPage} page`));
  await page.goto(gunDetailPage, { waitUntil: "domcontentloaded" });
}

export async function getDetailStats(page: Page, field: string) {
  const row = page.locator("tr", {
    has: page.locator("td:first-child", { hasText: field }),
  });
  const secondTd = row.locator("td").nth(1);
  return (await secondTd.innerText()).trim() ?? "";
}

export function parseComplexDpsText(text: string, gunId: string): TDamagePerSecond[] {
  const parts = text.split("\n");

  // Handle special cases for specific guns
  switch (gunId) {
    case "Crescent_Crossbow": {
      const [first, second] = text.split(/(\d+(?:\.\d+)?) and up/).filter(Boolean);
      return [{ condition: unwrapParentheses(second.trim()), value: parseFloat(first.trim()), isMin: true }];
    }
    case "Turbo-Gun": {
      const [min, max] = text.split("-").map((v) => parseFloat(v));
      return [
        { condition: "Min", value: min },
        { condition: "Max", value: max },
      ];
    }
    case "Prize_Pistol": {
      // https://enterthegungeon.fandom.com/wiki/Prize_Pistol
      return [{ condition: "Default", value: 0 }];
    }
  }

  const res: TDamagePerSecond[] = [];
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
  } else if (!Number.isNaN(Number(text))) {
    // a simple numeric value in the detail page
    res.push({ condition: "Default", value: parseFloat(text) });
  } else {
    throw new Error(`Unknown DPS format of ${gunId}: ` + chalk.green(text));
  }

  return res;
}

async function parseDpsText(gunDto: IGunDto, page: Page): Promise<TDamagePerSecond[]> {
  const dpsText = gunDto.dps;
  const isComplexDps = Number.isNaN(Number(dpsText));

  if (!isComplexDps) {
    return [{ condition: "Default", value: parseFloat(dpsText) }];
  }

  logDps(chalk.grey(`Parsing complex DPS text: "${chalk.bgGray(dpsText)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const dpsDetailText = await getDetailStats(page, "DPS");
  logDps(chalk.grey("> Parsing:"));
  logDps(chalk.magenta(dpsDetailText));

  const res = parseComplexDpsText(dpsDetailText, gunDto.id);
  logDps(chalk.yellow(JSON.stringify(res)));
  logDps("\n");

  return res;
}

export function parseComplexMagText(text: string, gunId: string): TMagazineSize[] {
  const parts = text.split("\n");

  // Handle special cases for specific guns
  switch (gunId) {
    // https://enterthegungeon.fandom.com/wiki/Gilded_Hydra
    case "Gilded_Hydra": {
      return [{ condition: "Increased by 1 for each half heart missing", value: parseFloat(text), isMin: true }];
    }
    // https://enterthegungeon.fandom.com/wiki/Triple_Gun
    case "Triple_Gun": {
      // mag size == max ammo = 500
      return parseComplexMagText(text.replace("∞", "500"), `${gunId}_handled`);
    }
    // https://enterthegungeon.fandom.com/wiki/Microtransaction_Gun
    case "Microtransaction_Gun": {
      return [{ condition: "Number of shells held", value: 0, isMin: true }];
    }
  }

  const res: TMagazineSize[] = [];
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
  } else if (!Number.isNaN(Number(text))) {
    // a simple numeric value in the detail page
    res.push({ condition: "Default", value: parseFloat(text) });
  } else {
    throw new Error(`Unknown Magazine Size format of ${gunId}: ` + chalk.green(text));
  }

  return res;
}

async function parseMagazineSizeText(gunDto: IGunDto, page: Page): Promise<TMagazineSize[]> {
  const magazineSize = gunDto.magazineSize;
  const isComplexValue = Number.isNaN(Number(magazineSize));

  if (!isComplexValue) {
    return [{ condition: "Default", value: parseFloat(magazineSize) }];
  }

  logMag(chalk.grey(`Parsing complex Magazine size text: "${chalk.bgGray(magazineSize)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const magDetailText = await getDetailStats(page, "Magazine Size");
  logMag(chalk.grey("> Parsing:"));
  logMag(chalk.magenta(magDetailText));

  const res = parseComplexMagText(magDetailText, gunDto.id);
  logMag(chalk.yellow(JSON.stringify(res)));
  logMag("\n");

  return res;
}

export async function getGuns() {
  const { browser, context, page } = await goToPage("https://enterthegungeon.fandom.com/wiki/Guns");

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

        const image = cells[0].querySelector("img")?.getAttribute("data-src") || "";
        const idHref = cells[1].querySelector("a")?.getAttribute("href") ?? "";
        const name = cells[1].textContent?.trim() || "";
        const quote = cells[3].textContent?.trim() || "";
        const qualityKey = cells[4].querySelector("img")?.getAttribute("data-image-key") || "";
        const type = cells[5].textContent?.trim() || "";
        const dps = cells[6].textContent?.trim() || "";
        const magazineSize = cells[7].textContent?.trim() || "";

        const id = idHref.split("/").pop() || "";

        return {
          id,
          name,
          image,
          quote,
          quality: qualityKey,
          type,
          dps,
          magazineSize,
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
      magazineSize: await parseMagazineSizeText(gunDto, page),
    });
  }

  // const qualitySet = gunDtos
  //   .filter((g) => Number.isNaN(Number(g.magazineSize)))
  //   .map((gun) => ({
  //     link: `https://enterthegungeon.fandom.com/wiki/${gun.id}`,
  //     mag: gun.magazineSize,
  //   }));
  // console.log(qualitySet);

  await context.close();
  await browser.close();

  return guns;
}

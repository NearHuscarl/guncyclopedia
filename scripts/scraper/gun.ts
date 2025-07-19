import chalk from "chalk";
import debug from "debug";
import startCase from "lodash/startCase.js";
import { type Page } from "playwright";
import { goToPage, INFINITY, unwrapParentheses } from "./util.ts";

const logStar = debug("gun:common");
const logDps = debug("gun:dps");
const logMag = debug("gun:mag");
const logAmmo = debug("gun:ammo");
const logFirerate = debug("gun:firerate");
const logReloadTime = debug("gun:reloadTime");

interface IComplexNumericStat {
  condition: string;
  isMin?: boolean;
  value: number;
}

type TNumbericStat = IComplexNumericStat[] | number;

export interface IGunDto {
  id: string;
  name: string;
  image: string;
  quote: string;
  quality: string;
  type: string;
  dps: string;
  magazineSize: string;
  ammoCapacity: string;
  fireRate: string;
  reloadTime: string;
}

export interface IGun {
  id: string;
  name: string;
  image: string;
  quote: string;
  quality: "S" | "A" | "B" | "C" | "D" | "N";
  type: "Semiautomatic" | "Charged" | "Burst" | "Automatic" | "Varies" | "Beam";
  dps: TNumbericStat;
  magazineSize: TNumbericStat;
  ammoCapacity: TNumbericStat;
  fireRate: TNumbericStat;
  reloadTime: TNumbericStat;
}

export async function goToGunDetailPage(page: Page, gunId: string) {
  const gunDetailPage = `https://enterthegungeon.fandom.com/wiki/${gunId}`;
  logStar(chalk.grey(`Navigating to ${gunDetailPage} page`));
  await page.goto(gunDetailPage, { waitUntil: "domcontentloaded" });
}

export async function getDetailStats(page: Page, gunId: string, field: string) {
  const row = page.locator("tr", {
    has: page.locator("td:first-child", { hasText: field }),
  });
  const secondTd = row.locator("td").nth(1);

  try {
    return (await secondTd.innerText({ timeout: 4000 })).trim() ?? "";
  } catch {
    logStar(chalk.red(`Failed to get ${field} for ${gunId}`));
    return "";
  }
}

function parseComplexNumericStat(text: string, gunId: string): IComplexNumericStat[] {
  const parts = text.split("\n").filter(Boolean);
  const res: IComplexNumericStat[] = [];
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
    throw new Error(`Unknown stat of ${gunId}: ` + chalk.green(text));
  }

  return res;
}

export function parseComplexDpsText(text: string, gunId: string): IComplexNumericStat[] {
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

  return parseComplexNumericStat(text, gunId);
}

async function parseDpsText(gunDto: IGunDto, page: Page): Promise<TNumbericStat> {
  const dpsText = gunDto.dps;
  const isComplexDps = Number.isNaN(Number(dpsText));

  if (!isComplexDps) {
    return parseFloat(dpsText);
  }

  logDps(chalk.grey(`Parsing complex DPS text: "${chalk.bgGray(dpsText)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const dpsDetailText = await getDetailStats(page, gunDto.id, "DPS");
  logDps(chalk.grey("> Parsing:"));
  logDps(chalk.magenta(dpsDetailText));

  const res = parseComplexDpsText(dpsDetailText, gunDto.id);
  logDps(chalk.yellow(JSON.stringify(res)));
  logDps("\n");

  return res;
}

export function parseComplexMagText(text: string, gunId: string): IComplexNumericStat[] {
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

  return parseComplexNumericStat(text, gunId);
}

async function parseMagazineSizeText(gunDto: IGunDto, page: Page): Promise<TNumbericStat> {
  const magazineSize = gunDto.magazineSize;
  const isComplexValue = Number.isNaN(Number(magazineSize));

  if (!isComplexValue) {
    return parseFloat(magazineSize);
  }

  logMag(chalk.grey(`Parsing complex Magazine size text: "${chalk.bgGray(magazineSize)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const magDetailText = await getDetailStats(page, gunDto.id, "Magazine Size");
  logMag(chalk.grey("> Parsing:"));
  logMag(chalk.magenta(magDetailText));

  const res = parseComplexMagText(magDetailText, gunDto.id);
  logMag(chalk.yellow(JSON.stringify(res)));
  logMag("\n");

  return res;
}

export function parseComplexAmmoCapacityText(text: string, gunId: string): IComplexNumericStat[] {
  // Handle special cases for specific guns
  switch (gunId) {
    // https://enterthegungeon.fandom.com/wiki/Microtransaction_Gun
    case "Microtransaction_Gun": {
      return [{ condition: "Number of shells held", value: 0, isMin: true }];
    }
  }

  return parseComplexNumericStat(text, gunId);
}

async function parseAmmoCapacityText(gunDto: IGunDto, page: Page): Promise<TNumbericStat> {
  const ammoCapacity = gunDto.ammoCapacity;
  const isComplexValue = Number.isNaN(Number(ammoCapacity));

  if (!isComplexValue) {
    return parseFloat(ammoCapacity);
  }

  logAmmo(chalk.grey(`Parsing complex Max Ammo text: "${chalk.bgGray(ammoCapacity)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const maxAmmoDetailText = await getDetailStats(page, gunDto.id, "Max Ammo");
  logAmmo(chalk.grey("> Parsing:"));
  logAmmo(chalk.magenta(maxAmmoDetailText));

  const res = parseComplexAmmoCapacityText(maxAmmoDetailText, gunDto.id);
  logAmmo(chalk.yellow(JSON.stringify(res)));
  logAmmo("\n");

  return res;
}

async function parseFireRateText(gunDto: IGunDto, page: Page): Promise<TNumbericStat> {
  // Handle special cases for specific guns
  switch (gunDto.id) {
    // https://enterthegungeon.fandom.com/wiki/Prototype_Railgun
    case "Railgun":
    case "Prototype_Railgun":
      return 0;
    // https://enterthegungeon.fandom.com/wiki/Gunderfury
    // No info on wiki
    case "Gunderfury":
    case "Dueling_Laser":
      return [{ condition: "Varies", value: -1 }];
  }

  const fireRate = gunDto.fireRate;
  const isComplexValue = Number.isNaN(Number(fireRate));
  const forceComplexParse = new Set(["Gunbow" /* incorrect stat in the main page */]);

  if (!isComplexValue && !forceComplexParse.has(gunDto.id)) {
    return parseFloat(fireRate);
  }

  logFirerate(chalk.grey(`Parsing complex Fire Rate text: "${chalk.bgGray(fireRate)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const fireRateDetail =
    (await getDetailStats(page, gunDto.id, "Fire Rate")) ||
    // Some bow weapons have charge time for a single shot instead of fire rate
    (await getDetailStats(page, gunDto.id, "Charge Time"));
  logFirerate(chalk.grey("> Parsing:"));
  logFirerate(chalk.magenta(fireRateDetail));

  const res = parseComplexNumericStat(fireRateDetail, gunDto.id);
  logFirerate(chalk.yellow(JSON.stringify(res)));
  logFirerate("\n");

  return res;
}

async function parseReloadTimeText(gunDto: IGunDto, page: Page): Promise<TNumbericStat> {
  // some pages don't have reload time, because they don't need it
  if (gunDto.magazineSize === gunDto.ammoCapacity) {
    return 0;
  }

  // https://enterthegungeon.fandom.com/wiki/Rad_Gun

  // Handle special cases for specific guns
  switch (gunDto.id) {
    // https://enterthegungeon.fandom.com/wiki/Gunderfury
    // No info on wiki
    case "Gunderfury":
      return [{ condition: "Varies", value: -1 }];
  }

  const reloadTime = gunDto.reloadTime;
  const isComplexValue = Number.isNaN(Number(reloadTime));

  if (!isComplexValue) {
    return parseFloat(reloadTime);
  }

  logReloadTime(chalk.grey(`Parsing complex Reload Time text: "${chalk.bgGray(reloadTime)}"...`));
  await goToGunDetailPage(page, gunDto.id);

  const reloadTimeDetail = await getDetailStats(page, gunDto.id, "Reload Time");
  logReloadTime(chalk.grey("> Parsing:"));
  logReloadTime(chalk.magenta(reloadTimeDetail));

  const res = parseComplexNumericStat(reloadTimeDetail, gunDto.id);
  logReloadTime(chalk.yellow(JSON.stringify(res)));
  logReloadTime("\n");

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

  const gunDtos = await page.$$eval(
    ".wikitable tr",
    (rows, { INFINITY }) => {
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
          const isInfiniteAmmo = cells[8].querySelector("img")?.getAttribute("data-image-key") === "Infinity.png";
          const ammoCapacity = isInfiniteAmmo ? INFINITY : cells[8].textContent?.trim() || "";
          const fireRate = cells[10].textContent?.trim() || "";
          const reloadTime = cells[11].textContent?.trim() || "";

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
            ammoCapacity,
            fireRate,
            reloadTime,
          };
        })
        .filter(Boolean) as IGunDto[];
    },
    { INFINITY }
  );

  const guns: IGun[] = [];
  for (const gunDto of gunDtos) {
    guns.push({
      ...gunDto,
      quality: qualityMap[gunDto.quality],
      type: gunDto.type as IGun["type"],
      dps: await parseDpsText(gunDto, page),
      magazineSize: await parseMagazineSizeText(gunDto, page),
      ammoCapacity: await parseAmmoCapacityText(gunDto, page),
      fireRate: await parseFireRateText(gunDto, page),
      reloadTime: await parseReloadTimeText(gunDto, page),
    });
  }

  const set = guns
    .filter((g) => Number.isNaN(g.reloadTime))
    .map((gun) => ({
      link: `https://enterthegungeon.fandom.com/wiki/${gun.id}`,
    }));
  console.log(set);

  await context.close();
  await browser.close();

  return guns;
}

// burstCooldownTime seems unused for gun assets, all have 0.2 so far
// cooldownTime: default to 1.0 for beam weapons?
// spread -> angleVariance

import path from "node:path";
import { writeFile } from "node:fs/promises";
import chalk from "chalk";

import { getGuns } from "./scraper/gun.ts";

async function main() {
  console.log(chalk.green("Fetching gun data..."));
  const guns = await getGuns();

  await writeFile(
    path.join(import.meta.dirname, "../data/guns.json"),
    JSON.stringify(guns, null, 2),
    { encoding: "utf-8" }
  );
}

await main();

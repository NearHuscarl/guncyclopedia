import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import { CLIENT_PATH } from "../constants.ts";

const SOURCE_PATH = path.join(import.meta.dirname, "client");

export async function copyClientCode() {
  console.log(chalk.green("cp client source..."));

  await rm(CLIENT_PATH, { recursive: true, force: true });
  await mkdir(CLIENT_PATH, { recursive: true });
  await cp(SOURCE_PATH, CLIENT_PATH, { recursive: true });
}

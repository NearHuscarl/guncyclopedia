import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import z from "zod/v4";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { AssetService } from "../asset/asset-service.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import type { TAssetExternalReference } from "../utils/schema.ts";
import { PlayerDto, type TPlayerDto } from "./player.dto.ts";

type Guid = string;

export class PlayerRepository {
  private static readonly _SEARCH_DIRECTORIES = ["assets/ExportedProject/Assets/resourcesbundle"].map((dir) =>
    path.join(ASSET_EXTRACTOR_ROOT, dir),
  );

  private _players = new Map<Guid, TPlayerDto>();
  private readonly _assetService: AssetService;
  private readonly _searchDirectories: string[];

  private constructor(assetService: AssetService, searchDirectories?: string[]) {
    this._assetService = assetService;
    this._searchDirectories = searchDirectories || PlayerRepository._SEARCH_DIRECTORIES;
  }

  static async create(_assetService: AssetService, searchDirectories?: string[]) {
    const instance = new PlayerRepository(_assetService, searchDirectories);
    return await instance.load();
  }

  private _isPlayerDto(obj: unknown): obj is TPlayerDto {
    return this._assetService.isMonoBehaviour(obj) && obj.m_Script.$$scriptPath.endsWith("PlayerController.cs.meta");
  }

  /**
   *
   * Item ids serializer algorithm:
   * 1. Use little endian: 2d030000 -> 0x0000032d -> 813 -> id of item
   * 2. If containing giberrish: )e010000 -> look at ')' on keyboard (9) -> 0x0000019e -> 414
   *
   * Examples:
   * ```
   * "4d000000"         -> [77]
   * "62010000"         -> [354]
   * ")e010000"         -> [414]     // ')' -> '9'  => "9e010000" -> 0x0000019e
   * "(c020000,a000000" -> [652, 10] // '(' -> '8', pad "c020000" -> "0c020000"
   * "5000000002000000" -> [80, 2]   // two back-to-back 4-byte LE ints
   * ```
   */
  private _decodeItemIds(input: string) {
    if (!input) return [];

    const numLookup = {
      ")": 0,
      "(": 9,
      "*": 8,
      "&": 7,
      "^": 6,
      "%": 5,
      $: 4,
      "#": 3,
      "@": 2,
      "!": 1,
    };

    // 1) Normalize: replace known '“gibberish with intended hex digits.
    //    Based on your keyboard note: ')' => 9, '(' => 8
    const numArrStr = input
      .trim()
      .split("")
      .map((char) => numLookup[char] ?? char)
      .join("");

    // 2) If commas exist, split; otherwise chunk every 8 chars.
    const tokens = numArrStr.includes(",") ? numArrStr.split(",").filter(Boolean) : (numArrStr.match(/.{1,8}/g) ?? []);

    // 3) Clean each token to valid hex, pad to 8 (left), then LE->int
    const out: number[] = [];
    for (const raw of tokens) {
      // Strip non-hex (after our mapping). Keep [0-9a-f] only.
      let hex = raw.toLowerCase().replace(/[^0-9a-f]/g, "");

      // If length < 8, left-pad; if > 8, take last 8 (most cases are 4 bytes).
      if (hex.length < 8) hex = hex.padStart(8, "0");
      if (hex.length > 8) hex = hex.slice(-8);

      // Validate again; skip if now empty.
      if (!/^[0-9a-f]{8}$/.test(hex)) continue;

      // Little-endian 4-byte to int: reverse byte pairs.
      const be = hex.slice(6, 8) + hex.slice(4, 6) + hex.slice(2, 4) + hex.slice(0, 2);

      out.push(parseInt(be, 16));
    }

    return out;
  }

  private async _getAllPlayerRefabFiles() {
    const res: string[] = [];

    for (const dir of this._searchDirectories) {
      const files = await readdir(dir);

      for (const file of files) {
        if (!file.endsWith(".prefab")) continue;
        const content = await readFile(path.join(dir, file), "utf-8");
        if (!content.includes("startingGunIds")) continue; // quick check to filter out non-player prefabs

        res.push(path.join(dir, file));
      }
    }

    return res;
  }

  private async _parsePlayer(filePath: string) {
    const refab = await this._assetService.parseSerializedAsset(filePath);
    for (const block of refab) {
      if (!this._isPlayerDto(block)) {
        continue;
      }

      try {
        const metaFilePath = filePath + ".meta";
        const $$id = this._getPlayerKey({ $$scriptPath: metaFilePath });
        block.startingActiveItemIds = this._decodeItemIds(block.startingActiveItemIds.toString());
        block.startingPassiveItemIds = this._decodeItemIds(block.startingPassiveItemIds.toString());
        block.startingGunIds = this._decodeItemIds(block.startingGunIds.toString());

        return PlayerDto.parse({ ...block, $$id });
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error(chalk.red(`Error parsing player dto at ${filePath}`));
          console.error(z.prettifyError(error));
        }
        throw error;
      }
    }
  }

  async load() {
    console.log(chalk.green("Loading player data..."));

    this._players = await restoreCache("player.repository");

    if (this._players.size > 0) {
      console.log(chalk.green(`Loaded ${chalk.yellow(this._players.size)} players from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, loading players from files..."));

    const prefabFiles = await this._getAllPlayerRefabFiles();
    const start = performance.now();

    for (let i = 0; i < prefabFiles.length; i++) {
      const file = prefabFiles[i];
      process.stdout.write(chalk.grey(`\rloading players from ${i + 1}/${prefabFiles.length} files...`));
      const projDto = await this._parsePlayer(file);
      if (!projDto) continue;

      this._players.set(projDto.$$id, projDto);
    }

    console.log();
    console.log(chalk.magenta(`Took ${(performance.now() - start) / 1000}s`));

    await saveCache("player.repository", this._players);
    return this;
  }

  private _getPlayerKey(assetReference: { $$scriptPath: string }) {
    return path.basename(assetReference.$$scriptPath, ".prefab.meta").replaceAll(" ", "_");
  }

  getPlayer(assetReference: Required<TAssetExternalReference>) {
    return this._players.get(this._getPlayerKey(assetReference));
  }
}

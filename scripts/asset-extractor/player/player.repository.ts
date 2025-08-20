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
   * 2. If encountering unkown character: map to the correct hexadecimal char
   *    from reverse engineering the source code.
   *
   * Examples:
   * ```
   * "4d000000"         -> [77]
   * "62010000"         -> [354]
   * "4d00000062010000" -> [77, 354]
   * ```
   */
  private _decodeItemIds(input: string) {
    if (!input) return [];

    const hexaCharacterLookup = {
      "(": 8,
      ")": 9,
      "*": "A",
      "+": "B",
      ",": "C",
      "-": "D",
    };

    // Tested characters:
    // - Pilot (PlayerRogue) https://enterthegungeon.fandom.com/wiki/The_Pilot
    // - Robot (PlayerRobot) https://enterthegungeon.fandom.com/wiki/The_Robot
    // - Ninja (PlayerNinja) https://enterthegungeon.fandom.com/wiki/The_Ninja
    // - Marine (PlayerMarine) https://enterthegungeon.fandom.com/wiki/The_Marine
    // - Lamey (PlayerLamey) https://enterthegungeon.fandom.com/wiki/Lamey
    //   -> Correct but why does https://enterthegungeon.fandom.com/wiki/Lamey_Gun use the Unfinished Gun sprite?
    // - Gunslinger (PlayerGunslinger) https://enterthegungeon.fandom.com/wiki/The_Gunslinger
    // - Hunter (PlayerGuide) https://enterthegungeon.fandom.com/wiki/The_Hunter
    // - Eevee (PlayerEevee) https://enterthegungeon.fandom.com/wiki/Eevee
    // - Cosmonaut (PlayerCosmonaut) https://enterthegungeon.fandom.com/wiki/The_Cosmonaut
    // - Cultist (PlayerCoopCultist) https://enterthegungeon.fandom.com/wiki/The_Cultist
    // - Convict (PlayerConvict) https://enterthegungeon.fandom.com/wiki/The_Convict
    // - Bullet (PlayerBullet) https://enterthegungeon.fandom.com/wiki/The_Bullet

    // 1) Normalize: replace unknown character with the correct hexa char.
    const numArrStr = input
      .trim()
      .split("")
      .map((char) => {
        if (/[0-9a-f]/.test(char)) return char;
        if (hexaCharacterLookup[char] !== undefined) return hexaCharacterLookup[char];
        throw new Error(`${char} from "${input}" is not mapped!`);
      })
      .join("");

    // 2) split into chunks of 8 chars.
    const tokens = numArrStr.match(/.{1,8}/g) ?? [];

    // 3) Clean each token to valid hex, pad to 8 (left), then LE->int
    const out: number[] = [];
    for (const raw of tokens) {
      // Strip non-hex (after our mapping). Keep [0-9a-f] only.
      let hex = raw.toLowerCase().replace(/[^0-9a-f]/g, "");

      // If length < 8, left-pad; if > 8, take last 8 (most cases are 4 bytes).
      if (hex.length < 8) hex = hex.padStart(8, "0");
      if (hex.length > 8) hex = hex.slice(-8);

      // Validate again; skip if now empty.
      if (!/^[0-9a-f]{8}$/.test(hex)) {
        throw new Error(`"${hex}" is not a valid hexadecimal number.`);
      }

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
        block.startingAlternateGunIds = this._decodeItemIds(block.startingAlternateGunIds.toString());
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

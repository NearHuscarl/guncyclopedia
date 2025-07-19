import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import yaml from "yaml";
import { getAllFileRecursively } from "./utils/path.ts";
import { ASSET_EXTRACTOR_ROOT } from "./constants.ts";
import { restoreCache, saveCache } from "./utils/cache.ts";

type Guid = string;

interface IUnityAssetBlock {
  $$typeID: number;
  $$fileID: number;
  $$typeName: string;
  [key: string]: unknown;
}

interface IMonoBehaviour extends IUnityAssetBlock {
  m_Script: {
    $$scriptPath: string;
    guid: string;
    fileID: number;
    type: number;
  };
}

type TUnityPrefab = (IUnityAssetBlock | IMonoBehaviour)[];

export class AssetService {
  private static readonly _ROOT_DIR = path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject");
  private static _guidMap = new Map<Guid, string>();

  static async load(): Promise<void> {
    this._guidMap = await restoreCache<Guid, string>("guid-to-asset-path");

    if (this._guidMap.size > 0) {
      console.log(chalk.green(`Loaded ${this._guidMap.size} meta file lookup from cache.`));
      return;
    }
    console.log(chalk.yellow("No cache found, create a map of all meta files..."));
    const metaFiles = await getAllFileRecursively(this._ROOT_DIR, "meta");

    console.log(chalk.grey(`Processing ${chalk.yellow(metaFiles.length)} meta files...`));
    for (const filePath of metaFiles) {
      try {
        const text = await readFile(filePath, "utf-8");
        const parsed = await this._parseYaml(text);
        const guid = parsed?.guid;
        if (typeof guid === "string") {
          this._guidMap.set(guid, path.relative(this._ROOT_DIR, filePath));
        }
      } catch {
        // skip invalid files
      }
    }

    await saveCache<Guid, string>("guid-to-asset-path", this._guidMap);
  }

  static getPathByGuid(guid: string): string | undefined {
    return this._guidMap.get(guid);
  }

  static async parseSerializedAsset(filePath: string): Promise<TUnityPrefab> {
    const unityFlavoredYaml = await readFile(path.join(ASSET_EXTRACTOR_ROOT, filePath), "utf8");
    // example split pattern '--- !u!114 &114082853474172005'
    const blocks = unityFlavoredYaml.split(/^--- !u!/gm).slice(1); // skip the YAML preamble
    const res: TUnityPrefab = [];

    for (const block of blocks) {
      const headerRegex = /^(\d+) &(\d+)\n(\w+):/;
      const headerMatch = block.match(headerRegex);
      if (!headerMatch) {
        throw new Error(`Invalid block header in file: ${filePath}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, _typeID, fileID, typeName] = headerMatch;
      const serializedBlock = await this._parseYaml(
        block
          .replace(headerRegex, "")
          .replace(/^\s{2}/gm, "")
          .trim()
      );

      if (typeof serializedBlock.m_Script === "object") {
        serializedBlock.m_Script.$$scriptPath = this.getPathByGuid(serializedBlock.m_Script.guid);
      }

      res.push({
        $$fileID: parseInt(fileID, 10),
        $$typeName: typeName,
        ...serializedBlock,
      });
    }

    return res;
  }

  private static async _parseYaml(content: string): Promise<ReturnType<typeof yaml.parse>> {
    return yaml.parse(content, {
      strict: false,
      version: "1.1",
    });
  }
}

import { readFile } from "node:fs/promises";
import path from "node:path";
import chalk from "chalk";
import cloneDeepWith from "lodash/cloneDeepWith.js";
import isPlainObject from "lodash/isPlainObject.js";
import { getAllFileRecursively, normalizePath } from "../utils/path.ts";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { restoreCache, saveCache } from "../utils/cache.ts";
import { parseYaml } from "../utils/yaml.ts";
import { AssetMeta, MonoBehaviour } from "./asset.dto.ts";
import type { TAssetMeta, TUnityAsset, Guid, TMonoBehaviour } from "./asset.dto.ts";
import type { TAssetExternalReference } from "../utils/schema.ts";

export class AssetService {
  static readonly GUN_SCRIPT = "Gun.cs.meta";
  static readonly PROJECTILE_SCRIPT = "Projectile.cs.meta";
  static readonly PROJECTILE_VOLLEY_SCRIPT = "ProjectileVolleyData.cs.meta";
  private readonly _DEFAULT_META_ROOT_DIR = path.join(ASSET_EXTRACTOR_ROOT, "assets/ExportedProject");

  private _assetPaths = new Map<Guid, string>();
  private readonly _metaRootDir: string;

  private constructor(metaRootDir?: string) {
    this._metaRootDir = metaRootDir || this._DEFAULT_META_ROOT_DIR;
  }

  static async create(metaRootDir?: string) {
    const instance = new AssetService(metaRootDir);
    return await instance.load();
  }

  async load() {
    this._assetPaths = await restoreCache<Guid, string>("guid-to-asset-path");

    if (this._assetPaths.size > 0) {
      console.log(chalk.green(`Loaded meta-file lookup (${this._assetPaths.size}) from cache.`));
      return this;
    }
    console.log(chalk.yellow("No cache found, create a asset path lookup of all meta files..."));
    const metaFiles = await getAllFileRecursively(this._metaRootDir, "meta");

    for (let i = 0; i < metaFiles.length; i++) {
      try {
        process.stdout.write(chalk.grey(`\rProcessing ${i + 1}/${metaFiles.length} meta files...`));

        const filePath = metaFiles[i];
        const meta = await this.parseAssetMeta(filePath);
        const assetPath = normalizePath(path.relative(this._metaRootDir, filePath));
        this._assetPaths.set(meta.guid, assetPath);
      } catch {
        // skip invalid files
      }
    }
    console.log();

    // await saveCache<Guid, string>("guid-bookmarks", this._guidBookmarks);
    await saveCache<Guid, string>("guid-to-asset-path", this._assetPaths);
    return this;
  }

  isMonoBehaviour(obj: unknown): obj is TMonoBehaviour {
    return MonoBehaviour.safeParse(obj).success;
  }

  getPathByGuid(guid: string): string | undefined {
    return this._assetPaths.get(guid);
  }

  referenceExists(assetReference: TAssetExternalReference): assetReference is Required<TAssetExternalReference> {
    if (!assetReference.$$scriptPath || !assetReference.guid || !assetReference.fileID) {
      return false;
    }
    return true;
  }

  async parseAssetMeta(filePath: string): Promise<TAssetMeta> {
    const text = await readFile(filePath, "utf8");
    const parsedMeta = parseYaml(text);
    return AssetMeta.parse(parsedMeta);
  }

  async parseSerializedAsset(filePath: string): Promise<TUnityAsset> {
    const unityFlavoredYaml = await readFile(path.join(ASSET_EXTRACTOR_ROOT, filePath), "utf8");
    // example split pattern '--- !u!114 &114082853474172005'
    const blocks = unityFlavoredYaml.split(/^--- !u!/gm).slice(1); // skip the YAML preamble
    const res: TUnityAsset = [];

    for (const block of blocks) {
      const headerRegex = /^(\d+) &(\d+)\n(\w+):/;
      const headerMatch = block.match(headerRegex);
      if (!headerMatch) {
        throw new Error(`Invalid block header in file: ${filePath}`);
      }

      const [_, _typeID, fileID, typeName] = headerMatch;

      const serializedBlock = parseYaml(
        block
          .replace(headerRegex, "")
          .replace(/^\s{2}/gm, "")
          .trim()
      );
      const blockWithResolvedScriptPaths = cloneDeepWith(serializedBlock, (value) => {
        if (isPlainObject(value) && "guid" in value) {
          const scriptPath = this.getPathByGuid(value.guid);
          if (scriptPath) {
            return { $$scriptPath: scriptPath, ...value };
          }
        }
      });

      res.push({
        $$fileID: parseInt(fileID, 10),
        $$typeName: typeName,
        ...blockWithResolvedScriptPaths,
      });
    }

    return res;
  }
}

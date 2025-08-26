import path from "node:path";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { execa } from "execa";
import chalk from "chalk";
import { ASSET_EXTRACTOR_ROOT } from "../constants.ts";
import { fileExists } from "../utils/fs.ts";

export class AudioService {
  private static readonly _AUDIO_PATH = path.join(ASSET_EXTRACTOR_ROOT, "cache/audio");
  private static readonly _TXTP_PATH = path.join(AudioService._AUDIO_PATH, "txtp");

  private static async _createTxtpFiles(soundbankPath: string) {
    const wwiserPath = path.join(ASSET_EXTRACTOR_ROOT, "audio/wwiser/wwiser.pyz");

    if (await fileExists(AudioService._TXTP_PATH)) {
      console.log(chalk.green("Skipping .txtp generation, cache already exists."));
      return;
    }

    console.log(chalk.green("Generating .txtp files..."));
    await mkdir(AudioService._TXTP_PATH, { recursive: true });

    const { stderr } = await execa({
      stdout: "inherit",
      cwd: path.resolve(ASSET_EXTRACTOR_ROOT, ".."),
    })`${wwiserPath} -g ${soundbankPath} -go ${AudioService._TXTP_PATH}`;
    console.log(stderr);
  }

  private static async _runVgmstream(shouldExtract: (fileName: string) => boolean) {
    console.log(chalk.green("Extracting audio assets..."));

    const vgmstreamPath = path.join(ASSET_EXTRACTOR_ROOT, "build/vgmstream-win/vgmstream-cli.exe");
    const outputPath = path.join(AudioService._AUDIO_PATH, "extracted");

    await rm(outputPath, { recursive: true, force: true });
    await mkdir(outputPath, { recursive: true });

    if (!(await fileExists(vgmstreamPath))) {
      throw new Error(
        `vgmstream-cli.exe not found at path: ${vgmstreamPath}.\nPlease read the ${chalk.green(path.join(ASSET_EXTRACTOR_ROOT, "README.md"))} for instructions on how to download it.`,
      );
    }

    const entries = await readdir(AudioService._TXTP_PATH, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".txtp")) continue;
      if (!shouldExtract(entry.name)) continue;

      const txtpPath = path.join(AudioService._TXTP_PATH, entry.name);

      // patch incorrect path for unclear reason
      const txtpContent = await readFile(txtpPath, "utf-8");
      await writeFile(
        txtpPath,
        txtpContent.replaceAll("../../../../../../../../../../../asset-extractor", ASSET_EXTRACTOR_ROOT),
        "utf-8",
      );

      const outputFilePath = path.join(outputPath, entry.name.replace(/\.txtp$/, ".ogg"));
      console.log(chalk.gray(`Extracting audio from: ${entry.name}`));
      await execa({ stderr: "inherit" })`${vgmstreamPath} -o ${outputFilePath} ${txtpPath}`;
    }
  }

  static async extractAudioAssets() {
    const bnkPath = path.join(
      ASSET_EXTRACTOR_ROOT,
      "assets/ExportedProject/Assets/StreamingAssets/Audio/GeneratedSoundBanks/Windows/SFX.bnk",
    );
    await AudioService._createTxtpFiles(bnkPath);

    // const extractPatterns = ["Play_WPN_Gun_Charge_01", "Play_WPN_Gun_Charge_02", "Play_WPN_Gun_Reload_01"];
    // await AudioService._runVgmstream((fileName) => extractPatterns.some((pattern) => fileName.startsWith(pattern)));
    await AudioService._runVgmstream((_fileName) => true);
  }
}

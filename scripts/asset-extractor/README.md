# Asset Extractor

## Instructions

- Download [`AssetRipper`](https://github.com/AssetRipper/AssetRipper)
- Open it > `File` > `Open Folder` > Select `path\to\your\Steam\steamapps\common\Enter the Gungeon\EtG_Data`
- Wait for the extraction
- `Export` > `Export All Files` > Select `{projectRoot}/scripts/asset-extractor/assets/`

To extract audio asset:

- Download `vgmstream-win` (only works on Windows) and put the content in this folder: `{projectRoot}/scripts/asset-extractor/build/vgmstream-win`
- Run `yarn extract-audio`, audio files are located in `{projectRoot}/scripts/asset-extractor/cache/audio/extracted`

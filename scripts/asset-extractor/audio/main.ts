import { AudioService } from "./audio.service.ts";

async function main() {
  await AudioService.extractAudioAssets();
}

await main();

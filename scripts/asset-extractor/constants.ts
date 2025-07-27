import path from "node:path";

export const ASSET_EXTRACTOR_ROOT = import.meta.dirname;

export const CLIENT_PATH = path.join(ASSET_EXTRACTOR_ROOT, "../../src/client/generated");

export const DATA_PATH = path.join(CLIENT_PATH, "data");
export const PUBLIC_PATH = path.join(ASSET_EXTRACTOR_ROOT, "../../public");

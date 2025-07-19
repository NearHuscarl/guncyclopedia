import { z } from "zod/v4";

export type Guid = string;

export const AssetMeta = z.object({
  guid: z.string(),
});

const UnityAssetBlock = z
  .object({
    $$fileID: z.number(),
    $$typeName: z.string(),
  })
  .catchall(z.unknown());

export const MonoBehaviour = UnityAssetBlock.extend({
  m_Script: z.object({
    $$scriptPath: z.string(),
    fileID: z.number(),
    guid: z.string(),
    type: z.number(),
  }),
});

export type TAssetMeta = z.infer<typeof AssetMeta>;
type TUnityAssetBlock = z.infer<typeof UnityAssetBlock>;
export type TMonoBehaviour = z.infer<typeof MonoBehaviour>;
export type TUnityAsset = (TUnityAssetBlock | TMonoBehaviour)[];

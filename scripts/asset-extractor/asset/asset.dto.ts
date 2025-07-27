import { z } from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export type Guid = string;

export const AssetMeta = z.object({
  guid: z.string(),
});

const UnityAssetBlock = z.object({
  $$fileID: z.number(),
  $$typeName: z.string(),
});

export const MonoBehaviour = UnityAssetBlock.extend({
  m_Script: z.object({
    $$scriptPath: z.string(),
    fileID: z.number(),
    guid: z.string(),
    type: z.number(),
  }),
});

export const MaterialBlock = UnityAssetBlock.extend({
  m_SavedProperties: z.object({
    m_TexEnvs: z.object({
      _MainTex: z.object({
        m_Texture: AssetExternalReference,
      }),
    }),
  }),
});

export type TMaterialBlock = z.infer<typeof MaterialBlock>;

export type TAssetMeta = z.infer<typeof AssetMeta>;
type TUnityAssetBlock = z.infer<typeof UnityAssetBlock>;
export type TMonoBehaviour = z.infer<typeof MonoBehaviour>;
export type TUnityAsset = (TUnityAssetBlock | TMonoBehaviour)[];

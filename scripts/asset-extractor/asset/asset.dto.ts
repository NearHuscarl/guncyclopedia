import { z } from "zod/v4";
import { AssetExternalReference } from "../utils/schema.ts";

export type Guid = string;

export const AssetMeta = z.object({
  guid: z.string(),
});

const Component = z.object({
  $$fileID: z.number(),
  $$component: z.string(),
});

export const MonoBehaviour = Component.extend({
  m_Script: z.object({
    $$scriptPath: z.string(),
    fileID: z.number(),
    guid: z.string(),
    type: z.number(),
  }),
});

export const Material = Component.extend({
  m_SavedProperties: z.object({
    m_TexEnvs: z.object({
      _MainTex: z.object({
        m_Texture: AssetExternalReference,
      }),
    }),
  }),
});

export type TMaterial = z.infer<typeof Material>;

export type TAssetMeta = z.infer<typeof AssetMeta>;
type TComponent = z.infer<typeof Component>;
export type TMonoBehaviour = z.infer<typeof MonoBehaviour>;
export type TUnityAsset = (TComponent | TMonoBehaviour)[];

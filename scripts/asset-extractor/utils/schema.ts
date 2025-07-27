import z from "zod/v4";

export const Position = z.object({
  x: z.number(),
  y: z.number(),
});

export type TPosition = z.input<typeof Position>;

export const BinaryOption = z.union([z.literal(0), z.literal(1)]);
export const Percentage = z.number().min(0).max(1);
export const AssetExternalReference = z.object({
  fileID: z.number(),
  guid: z.string().optional(),
  $$scriptPath: z.string().optional(),
});

export const AssetExternalReferences = z
  .array(AssetExternalReference)
  .transform((v) => v.filter((ref) => ref.fileID !== 0));
export type TAssetExternalReference = z.infer<typeof AssetExternalReference>;

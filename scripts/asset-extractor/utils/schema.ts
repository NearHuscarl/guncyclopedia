import z4 from "zod/v4";

export const BinaryOption = z4.union([z4.literal(0), z4.literal(1)]);

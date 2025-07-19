import z from "zod/v4";

export const Translation = z.record(z.string(), z.string());

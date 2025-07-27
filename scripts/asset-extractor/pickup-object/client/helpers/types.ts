import type { TGun } from "../models/gun.model.ts";
import type { TItem } from "../models/item.model.ts";
import type { TPickupObject } from "../models/pickup-object.model.ts";

export function isGun(obj: TPickupObject): obj is TGun {
  return typeof obj === "object" && "type" in obj && obj.type === "gun";
}

export function isItem(obj: TPickupObject): obj is TItem {
  return typeof obj === "object" && "type" in obj && obj.type === "item";
}

import memoize from "lodash/memoize";
import pickupObjects from "./generated/data/pickup-objects.json";
import { isGun } from "./generated/helpers/types";
import type { TGun } from "./generated/models/gun.model";
import type { TPickupObject } from "./generated/models/pickup-object.model";

export const getPickupObjects = (): TPickupObject[] => {
  return pickupObjects as TPickupObject[];
};

export const getGuns = memoize((): TGun[] => {
  return getPickupObjects().filter(isGun);
});

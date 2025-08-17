import startCase from "lodash/startCase";
import { H3 } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import clsx from "clsx";
import type { TGun } from "@/client/generated/models/gun.model";

export function Features({ gun, className }: { gun: TGun; className?: string }) {
  if (gun.featureFlags.length === 0) {
    return null;
  }

  return (
    <div className={clsx("flex items-baseline gap-4", className)}>
      <H3>Features:</H3>
      <div className="flex flex-wrap gap-2">
        {gun.featureFlags.map((f) => (
          <Badge key={f} className="text-sm px-2 py-1">
            {startCase(f)}
          </Badge>
        ))}
      </div>
    </div>
  );
}

import { H3 } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import type { TGun } from "@/client/generated/models/gun.model";

export function Tags({ gun }: { gun: TGun }) {
  if (gun.featureFlags.length === 0) {
    return null;
  }

  return (
    <div className="flex items-baseline gap-4">
      <H3>Tags:</H3>
      <div className="flex flex-wrap gap-2">
        {gun.featureFlags.map((tag) => (
          <Badge key={tag} variant="outline" className="text-sm px-2 py-1">
            #{tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}

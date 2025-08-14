import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { ProjectilePerShot, type TProjectilePerShot } from "@/client/generated/models/gun.model";
import { ShootStyleItem } from "../shared/components/shoot-style-item";

const sortWeight: Record<TProjectilePerShot["shootStyle"], number> = {
  Automatic: 0,
  SemiAutomatic: 1,
  Charged: 2,
  Beam: 3,
  Burst: 4,
};
const options = [...ProjectilePerShot.shape.shootStyle.options].sort((a, b) => sortWeight[a] - sortWeight[b]);

export function ShootStyleMenu() {
  const setFilter = useFilterStateMutation();
  const shootStyle = useFilter((state) => state.shootStyle);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Shoot Style</MenubarSubTrigger>
      <MenubarSubContent>
        {["None"].concat(options).map((o) => {
          return (
            <MenubarCheckboxItem
              key={o}
              className="flex items-center"
              checked={o === (shootStyle ?? "None")}
              onCheckedChange={(checked) => {
                const r = o === "None" || !checked ? undefined : o;
                setFilter({ shootStyle: r as typeof shootStyle });
              }}
            >
              <ShootStyleItem value={o as typeof shootStyle} />
            </MenubarCheckboxItem>
          );
        })}
      </MenubarSubContent>
    </MenubarSub>
  );
}

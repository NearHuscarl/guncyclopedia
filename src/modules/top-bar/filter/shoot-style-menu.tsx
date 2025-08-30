import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { ProjectileModule, type TProjectileModule } from "@/client/generated/models/gun.model";
import { UppercasedItem } from "../shared/components/uppercased-item";

const sortWeight: Record<TProjectileModule["shootStyle"], number> = {
  Automatic: 0,
  SemiAutomatic: 1,
  Charged: 2,
  Beam: 3,
  Burst: 4,
};
const options = [...ProjectileModule.shape.shootStyle.options].sort((a, b) => sortWeight[a] - sortWeight[b]);

export function ShootStyleMenu() {
  const setFilter = useFilterStateMutation();
  const shootStyle = useFilter((state) => state.shootStyle);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Shoot Style</MenubarSubTrigger>
      <MenubarSubContent>
        {["All"].concat(options).map((o) => {
          return (
            <MenubarCheckboxItem
              key={o}
              className="flex items-center"
              checked={o === (shootStyle ?? "All")}
              onCheckedChange={(checked) => {
                const r = o === "All" || !checked ? undefined : o;
                setFilter({ shootStyle: r as typeof shootStyle });
              }}
            >
              <UppercasedItem value={o} />
            </MenubarCheckboxItem>
          );
        })}
      </MenubarSubContent>
    </MenubarSub>
  );
}

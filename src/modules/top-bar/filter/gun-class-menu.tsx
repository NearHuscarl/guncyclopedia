import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { Gun } from "@/client/generated/models/gun.model";
import { UppercasedItem } from "../shared/components/uppercased-item";

const options = [...Gun.shape.gunClass.options];

export function GunClassMenu() {
  const setFilter = useFilterStateMutation();
  const gunClass = useFilter((state) => state.gunClass);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Gun Class</MenubarSubTrigger>
      <MenubarSubContent>
        {["All"].concat(options).map((o) => {
          return (
            <MenubarCheckboxItem
              key={o}
              className="flex items-center"
              checked={o === (gunClass ?? "All")}
              onCheckedChange={(checked) => {
                const r = o === "All" || !checked ? undefined : o;
                setFilter({ gunClass: r as typeof gunClass });
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

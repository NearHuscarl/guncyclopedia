import startCase from "lodash/startCase";
import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { RangeLabel } from "@/client/service/projectile.service";

const options = [...RangeLabel.options];

export function RangeMenu() {
  const setFilter = useFilterStateMutation();
  const range = useFilter((state) => state.range);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Range</MenubarSubTrigger>
      <MenubarSubContent>
        {["All"].concat(options).map((o) => {
          return (
            <MenubarCheckboxItem
              key={o}
              className="flex items-center"
              checked={o === (range ?? "All")}
              onCheckedChange={(checked) => {
                const r = o === "All" || !checked ? undefined : o;
                setFilter({ range: r as typeof range });
              }}
            >
              {startCase(o)}
            </MenubarCheckboxItem>
          );
        })}
      </MenubarSubContent>
    </MenubarSub>
  );
}

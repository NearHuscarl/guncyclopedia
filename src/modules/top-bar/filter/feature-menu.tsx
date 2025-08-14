import startCase from "lodash/startCase";
import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { useLoaderData } from "@/modules/shared/hooks/useLoaderData";

export function FeatureMenu() {
  const setFilter = useFilterStateMutation();
  const features = useLoaderData((state) => state.stats.features);
  const feature = useFilter((state) => state.feature);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Feature</MenubarSubTrigger>
      <MenubarSubContent>
        {["All"].concat(features).map((f) => {
          return (
            <MenubarCheckboxItem
              key={f}
              className="flex items-center"
              checked={f === (feature ?? "All")}
              onCheckedChange={(checked) => {
                const r = f === "All" || !checked ? undefined : f;
                setFilter({ feature: r as typeof feature });
              }}
            >
              {startCase(f)}
            </MenubarCheckboxItem>
          );
        })}
      </MenubarSubContent>
    </MenubarSub>
  );
}

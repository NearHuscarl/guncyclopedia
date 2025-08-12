import { MenubarCheckboxItem, MenubarSub, MenubarSubContent, MenubarSubTrigger } from "@/components/ui/menubar";
import { useFilterStateMutation } from "../../shared/hooks/useFilterStateMutation";
import { useFilter } from "@/modules/shared/hooks/useFilter";
import { Gun } from "@/client/generated/models/gun.model";
import { ChestItem } from "../shared/components/chest-item";

const sortedQualities = [...Gun.shape.quality.options].reverse();

export function QualityMenu() {
  const setFilter = useFilterStateMutation();
  const quality = useFilter((state) => state.quality);

  return (
    <MenubarSub>
      <MenubarSubTrigger>Quality</MenubarSubTrigger>
      <MenubarSubContent>
        {["None"].concat(sortedQualities).map((q) => {
          return (
            <MenubarCheckboxItem
              key={q}
              className="flex items-center"
              checked={q === (quality ?? "None")}
              onCheckedChange={(checked) => {
                const r = q === "None" || !checked ? undefined : q;
                setFilter({ quality: r as typeof quality });
              }}
            >
              <ChestItem quality={q as typeof quality} />
            </MenubarCheckboxItem>
          );
        })}
      </MenubarSubContent>
    </MenubarSub>
  );
}

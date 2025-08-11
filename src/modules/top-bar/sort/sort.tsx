import startCase from "lodash/startCase";
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useAppState } from "@/modules/shared/hooks/useAppState";
import { useAppStateMutation } from "@/modules/shared/hooks/useAppStateMutation";
import { ArrowDownNarrowWide } from "lucide-react";

export function Sort() {
  const sortBy = useAppState((state) => state.sortBy);
  const setAppState = useAppStateMutation();
  const sortOptions = ["quality", "maxAmmo", "cooldownTime"];

  return (
    <MenubarMenu>
      <MenubarTrigger>
        <ArrowDownNarrowWide size={15} />
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem disabled>Sort by...</MenubarItem>
        <MenubarSeparator />
        {sortOptions.map((o) => (
          <MenubarCheckboxItem
            key={o}
            checked={sortBy === (o ?? "None")}
            onCheckedChange={(checked) => {
              const r = !checked ? undefined : o;
              setAppState({ sortBy: r as typeof sortBy });
            }}
          >
            {startCase(o)}
          </MenubarCheckboxItem>
        ))}
      </MenubarContent>
    </MenubarMenu>
  );
}

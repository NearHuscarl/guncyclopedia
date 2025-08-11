import { Menubar } from "@/components/ui/menubar";
import { Filter } from "./filter";
import { Sort } from "./sort";
import { Group } from "./group";

export function MainMenu() {
  return (
    <Menubar>
      <Filter />
      <Sort />
      <Group />
    </Menubar>
  );
}

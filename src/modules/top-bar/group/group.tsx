import { TableOfContents } from "lucide-react";
import {
  MenubarCheckboxItem,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";

export function Group() {
  return (
    <MenubarMenu>
      <MenubarTrigger>
        <TableOfContents size={15} />
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem disabled>Group by...</MenubarItem>
        <MenubarSeparator />
        <MenubarCheckboxItem>TODO</MenubarCheckboxItem>
      </MenubarContent>
    </MenubarMenu>
  );
}

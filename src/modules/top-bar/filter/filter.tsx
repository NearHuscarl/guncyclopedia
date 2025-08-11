import { MenubarContent, MenubarMenu, MenubarTrigger, MenubarSeparator, MenubarItem } from "@/components/ui/menubar";
import { Funnel } from "lucide-react";
import { ColorMenu } from "./color-menu";
import { FeatureMenu } from "./feature-menu";

export function Filter() {
  return (
    <MenubarMenu>
      <MenubarTrigger>
        <Funnel size={15} />
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem disabled>Filter by...</MenubarItem>
        <MenubarSeparator />
        <ColorMenu />
        <MenubarSeparator />
        <FeatureMenu />
      </MenubarContent>
    </MenubarMenu>
  );
}

import { MenubarContent, MenubarMenu, MenubarTrigger, MenubarSeparator, MenubarItem } from "@/components/ui/menubar";
import { Funnel } from "lucide-react";
import { ColorMenu } from "./color-menu";
import { FeatureMenu } from "./feature-menu";
import { QualityMenu } from "./quality-menu";
import { ShootStyleMenu } from "./shoot-style-menu";
import { GunClassMenu } from "./gun-class-menu";
import { RangeMenu } from "./range-menu";

export function Filter() {
  return (
    <MenubarMenu>
      <MenubarTrigger>
        <Funnel size={15} />
      </MenubarTrigger>
      <MenubarContent>
        <MenubarItem disabled>Filter by...</MenubarItem>
        <QualityMenu />
        <ShootStyleMenu />
        <RangeMenu />
        <MenubarSeparator />
        <ColorMenu />
        <MenubarSeparator />
        <GunClassMenu />
        <FeatureMenu />
      </MenubarContent>
    </MenubarMenu>
  );
}

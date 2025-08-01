import { H1 } from "@/components/ui/typography";
import { TopBarMenu } from "./top-bar-menu";
import { Separator } from "@/components/ui/separator";

export function TopBar() {
  return (
    <div className="flex gap-2 p-2 items-center text-primary">
      <img src="/icon.png" alt="Icon" className="w-8 h-8" />
      <H1>Guncyclopedia</H1>
      <Separator orientation="vertical" className="mx-4 relative top-1" />
      <div className="relative top-1">
        <TopBarMenu />
      </div>
    </div>
  );
}

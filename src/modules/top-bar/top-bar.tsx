import { H1 } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";
import { TopBarLinks } from "./top-bar-links";
import { MainMenu } from "./main-menu";
import { Search } from "./search";
import { AppState } from "./app-state";
import { Toolbar } from "./toolbar";

export function TopBar() {
  return (
    <>
      <div className="flex gap-2 p-2 items-center text-primary">
        <img src="/icon.png" alt="Icon" className="w-8 h-8" />
        <H1>Guncyclopedia</H1>
        <Separator orientation="vertical" className="mx-4 relative top-1" />
        <div className="flex justify-between relative top-1 w-full">
          <div className="flex gap-2">
            <Search />
            <MainMenu />
            <Toolbar />
          </div>
          <TopBarLinks />
        </div>
      </div>
      <AppState className="px-2" />
    </>
  );
}

import { Button } from "@/components/ui/button";
import { Github, BookOpenText, Youtube, ArrowLeftRight } from "lucide-react";
import { useSelectedGun } from "../shared/hooks/useGuns";
import { useGunStore } from "../shared/store/gun.store";

export function TopBarActions() {
  const gun = useSelectedGun();
  const isComparisonMode = useGunStore((state) => state.isComparisonMode);
  const setIsComparisonMode = useGunStore((state) => state.setComparisonMode);

  return (
    <div className="flex">
      <Button
        variant={isComparisonMode ? "default" : "ghost"}
        size="icon"
        title="Comparison Mode"
        onClick={() => setIsComparisonMode(!isComparisonMode)}
      >
        <ArrowLeftRight className="w-5 h-5 fill-primary" />
      </Button>
      {gun.video && (
        <Button asChild variant="ghost" size="icon" aria-label="YouTube video" slot="a">
          <a href={gun.video} target="_blank" rel="noopener noreferrer">
            <Youtube />
          </a>
        </Button>
      )}
      {gun.name && (
        <Button asChild variant="ghost" size="icon" aria-label="GitHub source code" slot="a">
          <a
            href={`https://enterthegungeon.fandom.com/wiki/${gun.name.replaceAll(" ", "_")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <BookOpenText className="w-5 h-5" />
          </a>
        </Button>
      )}
      <Button asChild variant="ghost" size="icon" aria-label="GitHub source code" slot="a">
        <a href="https://github.com/NearHuscarl/guncyclopedia" target="_blank" rel="noopener noreferrer">
          <Github className="w-5 h-5" />
        </a>
      </Button>
    </div>
  );
}

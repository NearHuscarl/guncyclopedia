import { Button } from "@/components/ui/button";
import { Github, BookOpenText } from "lucide-react";
import { useSelectedGun } from "../shared/hooks/useGuns";

export function TopBarLinks() {
  const gun = useSelectedGun();
  return (
    <div>
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

import { SquareX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PropsWithChildren } from "react";

export function Chip(props: PropsWithChildren<{ onDelete?: () => void }>) {
  return (
    <Badge>
      {props.children}
      {props.onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="pl-1 size-3 relative top-[1px] hover:text-red-500"
          onClick={props.onDelete}
        >
          <SquareX className="size-3.5!" />
        </Button>
      )}
    </Badge>
  );
}

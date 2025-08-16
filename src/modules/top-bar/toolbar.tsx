import { Button } from "@/components/ui/button";
import { GitCompareArrows } from "lucide-react";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

export function Toolbar() {
  const isComparisonMode = useAppState((state) => state.isComparisonMode);
  const setAppState = useAppStateMutation();

  return (
    <div className="flex">
      <Button
        variant={isComparisonMode ? "default" : "secondary"}
        size="icon"
        title="Comparison Mode"
        onClick={() => setAppState({ isComparisonMode: isComparisonMode ? undefined : true })}
      >
        <GitCompareArrows />
      </Button>
    </div>
  );
}

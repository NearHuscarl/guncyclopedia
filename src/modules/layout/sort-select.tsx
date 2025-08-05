import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "../shared/hooks/useAppState";
import { Muted } from "@/components/ui/typography";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

export function SortSelect() {
  const sortBy = useAppState((state) => state.sortBy);
  const setAppState = useAppStateMutation();

  return (
    <>
      <Muted>Sort by</Muted>
      <Select
        value={sortBy}
        onValueChange={(v) => setAppState({ sortBy: (v === "none" ? undefined : v) as typeof sortBy })}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="quality">Quality</SelectItem>
          <SelectItem value="maxAmmo">Max Ammo</SelectItem>
          <SelectItem value="cooldownTime">Cooldown Time</SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

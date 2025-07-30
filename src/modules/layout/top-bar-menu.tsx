import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

export function TopBarMenu() {
  const sortBy = useAppState((state) => state.sortBy);
  const setAppState = useAppStateMutation();
  return (
    <Select value={sortBy} onValueChange={(v) => setAppState({ sortBy: v as typeof sortBy })}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">None</SelectItem>
        <SelectItem value="quality">Quality</SelectItem>
        <SelectItem value="maxAmmo">Max Ammo</SelectItem>
        <SelectItem value="cooldownTime">Cooldown Time</SelectItem>
      </SelectContent>
    </Select>
  );
}

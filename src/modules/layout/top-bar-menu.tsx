import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUiStore } from "../shared/store/ui.store";

export function TopBarMenu() {
  const sortBy = useUiStore((state) => state.gun.sortBy);
  const setSortBy = useUiStore((state) => state.setSortBy);
  return (
    <Select value={sortBy} onValueChange={setSortBy}>
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

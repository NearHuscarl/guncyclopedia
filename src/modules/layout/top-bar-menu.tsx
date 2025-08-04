import startCase from "lodash/startCase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { basicColors } from "@/client/generated/models/color.model";
import { Muted } from "@/components/ui/typography";
import { Search } from "./search";

export function TopBarMenu() {
  const sortBy = useAppState((state) => state.sortBy);
  const color = useAppState((state) => state.color);
  const setAppState = useAppStateMutation();

  return (
    <div>
      <div className="flex items-center gap-4">
        <Search />
        <Muted>Sort by</Muted>
        <Select value={sortBy} onValueChange={(v) => setAppState({ sortBy: v as typeof sortBy })}>
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
        <Muted>Color</Muted>
        <Select
          value={!color ? "None" : color}
          onValueChange={(v) => {
            const r = v === "None" ? undefined : v;
            setAppState({ color: r });
          }}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Color" />
          </SelectTrigger>
          <SelectContent>
            {["None"].concat(Object.keys(basicColors)).map((key) => {
              const backgroundColor = basicColors[key]?.[1] ?? basicColors[key]?.[0];
              return (
                <SelectItem key={key} value={key} className="flex items-center">
                  <div
                    className="w-4 h-4 inline-block mr-1 border border-stone-700"
                    style={{ backgroundColor, borderColor: backgroundColor }}
                  />
                  {startCase(key)}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

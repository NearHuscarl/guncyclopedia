import startCase from "lodash/startCase";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { basicColors } from "@/client/generated/models/color.model";
import { Muted } from "@/components/ui/typography";

export function ColorSelect() {
  const color = useAppState((state) => state.color);
  const setAppState = useAppStateMutation();

  return (
    <>
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
    </>
  );
}

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Muted } from "@/components/ui/typography";
import { useLoaderData } from "../shared/hooks/useLoaderData";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { useAppState } from "../shared/hooks/useAppState";

export function TagSelect() {
  const tags = useLoaderData((state) => state.stats.tags);
  const tag = useAppState((state) => state.tag);
  const setAppState = useAppStateMutation();

  return (
    <>
      <Muted>Tags</Muted>
      <Select
        value={!tag ? "None" : tag}
        onValueChange={(v) => {
          const r = v === "None" ? undefined : v;
          setAppState({ tag: r as typeof tag });
        }}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Tags" />
        </SelectTrigger>
        <SelectContent>
          {["None"].concat(tags).map((t) => {
            return (
              <SelectItem key={t} value={t} className="flex items-center">
                {t === "None" ? "None" : `#${t}`}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </>
  );
}

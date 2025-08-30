import clsx from "clsx";
import startCase from "lodash/startCase";
import { useFilter, type TFilter } from "../shared/hooks/useFilter";
import { Muted } from "@/components/ui/typography";
import { Chip } from "../shared/components/chip";
import { useFilterStateMutation } from "../shared/hooks/useFilterStateMutation";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { ColorItem } from "./shared/components/color-item";
import { ChestItem } from "./shared/components/chest-item";
import { UppercasedItem } from "./shared/components/uppercased-item";
import type { TGun, TProjectileModule } from "@/client/generated/models/gun.model";

function getValueComponent(filterKey: keyof TFilter, value: string) {
  if (filterKey === "primaryColor" || filterKey === "secondaryColor") {
    return <ColorItem color={value} size="small" />;
  }
  if (filterKey === "quality") {
    return <ChestItem quality={value as TGun["quality"]} size="small" />;
  }
  if (filterKey === "shootStyle") {
    return <UppercasedItem value={value as TProjectileModule["shootStyle"]} />;
  }
  return <span>{startCase(value)}</span>;
}

type TAppStateProps = {
  className?: string;
};

export function AppState({ className }: TAppStateProps) {
  const filter = useFilter() ?? {};
  const sortBy = useAppState((state) => state.sortBy);
  const filterEntries = Object.entries(filter) as [keyof TFilter, string][];
  const setFilter = useFilterStateMutation();
  const setAppState = useAppStateMutation();

  return (
    <div className={clsx("flex gap-2 items-baseline h-8 pt-1", className)}>
      <Muted className="text-xs">Filters:</Muted>
      {filterEntries.length === 0 && <Chip>None</Chip>}
      {filterEntries.map(([key, value]) => {
        return (
          <Chip key={key} onDelete={() => setFilter({ [key]: undefined })}>
            <Muted className="text-xs">{`${key}: `}</Muted>
            {getValueComponent(key, value)}
          </Chip>
        );
      })}
      <Muted className="text-xs">Sort:</Muted>
      {sortBy && sortBy !== "none" ? (
        <Chip onDelete={() => setAppState({ sortBy: undefined })}>{startCase(sortBy)}</Chip>
      ) : (
        <Chip>None</Chip>
      )}
    </div>
  );
}

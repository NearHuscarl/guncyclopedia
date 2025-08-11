import clsx from "clsx";
import startCase from "lodash/startCase";
import { useFilter } from "../shared/hooks/useFilter";
import { Muted } from "@/components/ui/typography";
import { Chip } from "../shared/components/chip";
import { useFilterStateMutation } from "../shared/hooks/useFilterStateMutation";
import { useAppState } from "../shared/hooks/useAppState";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

type TAppStateProps = {
  className?: string;
};

export function AppState({ className }: TAppStateProps) {
  const filter = useFilter() ?? {};
  const sortBy = useAppState((state) => state.sortBy);
  const filterEntries = Object.entries(filter);
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
            {startCase(value)}
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

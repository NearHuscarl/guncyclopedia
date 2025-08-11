import { useNavigate } from "@tanstack/react-router";
import type { TAppState } from "./useAppState";

export function useFilterStateMutation() {
  const navigate = useNavigate();
  return (filter: TAppState["filter"]) =>
    navigate({
      from: "/",
      to: "/",
      search: (prev) => {
        const newFilter = { ...prev.filter, ...filter };
        const isEmptyFilter = Object.values(newFilter).filter((v) => v !== undefined).length === 0;
        return { ...prev, filter: isEmptyFilter ? /* remove &filter= in the url */ undefined : newFilter };
      },
    });
}

import { useNavigate } from "@tanstack/react-router";
import type { TAppState } from "./useAppState";

export function useAppStateMutation() {
  const navigate = useNavigate();
  return (search: TAppState) =>
    navigate({
      from: "/",
      to: "/",
      search: (prev) => ({ ...prev, ...search }),
      viewTransition: false,
      reloadDocument: false,
    });
}

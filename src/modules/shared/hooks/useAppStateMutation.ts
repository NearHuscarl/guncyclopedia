import { useNavigate } from "@tanstack/react-router";
import type { TAppState } from "./useAppState";

export function useAppStateMutation() {
  const navigate = useNavigate();
  return (search: TAppState) =>
    navigate({
      from: "/",
      to: "/",
      search: (prev) => ({ ...prev, ...search }),
      replace: true,
      viewTransition: false,
      reloadDocument: false,
    });
}

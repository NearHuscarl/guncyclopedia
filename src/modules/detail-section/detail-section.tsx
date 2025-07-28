import { useLoaderData } from "@tanstack/react-router";
import { useUiStore } from "../main/ui.store";

export function DetailSection() {
  const { guns } = useLoaderData({ from: "/" });
  const selectedItemId = useUiStore((state) => state.selectedItemId);

  if (selectedItemId === -1) {
    return null;
  }

  const { animation: _, ...other } = guns.find((gun) => gun.id === selectedItemId) || {};

  return (
    <div>
      <pre className="text-left break-words whitespace-pre-wrap">{JSON.stringify(other, null, 2)}</pre>
    </div>
  );
}

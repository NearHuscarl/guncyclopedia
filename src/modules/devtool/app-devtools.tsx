import { useIsDebug, useSearchParams } from "@/lib/hooks";
import { useNavigate } from "@tanstack/react-router";

export function AppDevtools() {
  const navigate = useNavigate({ from: "/" });
  const isDebug = useIsDebug();
  const search = useSearchParams();
  const toggleDebug = () => {
    navigate({
      to: "/",
      search: { ...search, debug: !isDebug },
      replace: true,
    });
  };

  return (
    <div
      className="fixed z-[10000] bottom-4 right-4 bg-black/80 text-white px-3 py-1 rounded shadow"
      data-testid="app-devtools"
    >
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <input type="checkbox" checked={isDebug} onChange={toggleDebug} className="accent-secondary" />
        Debug mode
      </label>
    </div>
  );
}

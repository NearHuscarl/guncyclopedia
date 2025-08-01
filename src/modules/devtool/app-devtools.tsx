import { useIsDebug } from "../shared/hooks/useDebug";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

export function AppDevtools() {
  const isDebug = useIsDebug();
  const setAppState = useAppStateMutation();
  const toggleDebug = () => {
    setAppState({ debug: !isDebug });
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

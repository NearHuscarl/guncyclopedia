import { DetailSection } from "./detail-section/detail-section";
import { TopBar } from "./top-bar/top-bar";
import { AppState } from "./top-bar/app-state";
import { ItemGrid } from "./main/item-grid";

export function Page() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <AppState className="px-2 mb-2" />
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex-3 overflow-y-auto p-2 pt-0">
          <ItemGrid />
        </div>
        <div className="w-lg">
          <DetailSection />
        </div>
      </div>
    </div>
  );
}

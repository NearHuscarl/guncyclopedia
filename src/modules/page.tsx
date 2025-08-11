import { DetailSection } from "./detail-section/detail-section";
import { TopBar } from "./top-bar/top-bar";
import { ItemGrid } from "./main/item-grid";

export function Page() {
  return (
    <div className="flex flex-col h-screen">
      <TopBar />
      <div className="flex gap-2 flex-1 min-h-0">
        <div className="flex-3 overflow-y-auto">
          <ItemGrid />
        </div>
        <div className="w-lg">
          <DetailSection />
        </div>
      </div>
    </div>
  );
}

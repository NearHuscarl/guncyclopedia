import { DetailSection } from "./detail-section/detail-section";
import { ItemGrid } from "./main/item-grid";

export function Page() {
  return (
    <div className="flex gap-2 h-screen">
      <div className="flex-3">
        <ItemGrid />
      </div>
      <div className="flex-1 overflow-y-auto">
        <DetailSection />
      </div>
    </div>
  );
}

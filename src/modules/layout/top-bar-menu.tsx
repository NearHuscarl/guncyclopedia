import { Search } from "./search";
import { TagSelect } from "./tag-select";
import { SortSelect } from "./sort-select";
import { ColorSelect } from "./color-select";

export function TopBarMenu() {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <Search />
      <SortSelect />
      <ColorSelect />
      <TagSelect />
    </div>
  );
}

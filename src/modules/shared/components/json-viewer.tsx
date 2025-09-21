import { JSONTree } from "react-json-tree";

export function JsonViewer({ data }: { data: unknown }) {
  return (
    <div className="text-left break-words whitespace-pre-wrap text-xs font-mono bg-stone-900 pt-0.5 pb-1 px-2 rounded">
      <JSONTree
        shouldExpandNodeInitially={() => true}
        data={data}
        theme={{
          scheme: "tailwind with near's blessings",
          author: "NearHuscarl (https://github.com/NearHuscarl)",
          base00: "oklch(21.6% 0.006 56.043)", // background stone900
          base01: "oklch(64.5% 0.246 16.439)",
          base02: "oklch(64.5% 0.246 16.439)",
          base03: "oklch(44.4% 0.011 73.639)", // stone600 folding text
          base04: "oklch(64.5% 0.246 16.439)",
          base05: "oklch(64.5% 0.246 16.439)",
          base06: "oklch(64.5% 0.246 16.439)",
          base07: "oklch(64.5% 0.246 16.439)",
          base08: "oklch(55.3% 0.013 58.071)", // stone500 undefined
          base09: "oklch(79.5% 0.184 86.047)", // yellow500 number
          base0A: "oklch(64.5% 0.246 16.439)",
          base0B: "oklch(62.7% 0.194 149.214)", // green600 string
          base0C: "oklch(64.5% 0.246 16.439)",
          base0D: "oklch(70.9% 0.01 56.259)", // stone400 property
          base0E: "oklch(64.5% 0.246 16.439)",
          base0F: "oklch(64.5% 0.246 16.439)",
        }}
        // theme="googles"
      />
    </div>
  );
}

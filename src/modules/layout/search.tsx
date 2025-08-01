"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGuns } from "../shared/hooks/useGuns";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";

export function Search() {
  const [open, setOpen] = React.useState(false);
  const [gunId, setGunId] = React.useState(-1);
  const setAppState = useAppStateMutation();
  const guns = useGuns();
  const sortedGuns = React.useMemo(() => [...guns].sort((a, b) => a.name.localeCompare(b.name)), [guns]);
  const gunLookup = React.useMemo(() => new Map(guns.map((gun) => [gun.name, gun])), [guns]);
  const selectedGun = React.useMemo(() => guns.find((gun) => gun.id === gunId), [gunId, guns]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          <div className="flex items-center gap-2">
            {selectedGun && (
              <div className="w-12 flex justify-center">
                <AnimatedSprite key={gunId} animation={selectedGun.animation} scale={1} />
              </div>
            )}
            {selectedGun?.name ?? "Find gun..."}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command
          filter={(value, search) => {
            const queryWords = search.toLowerCase().split(/\s+/).filter(Boolean);
            const target = value.toLowerCase();

            const allMatch = queryWords.every((query) => target.includes(query));
            return allMatch ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search gun..." />
          <CommandList>
            <CommandEmpty>No gun found.</CommandEmpty>
            <CommandGroup>
              {sortedGuns.map((gun) => (
                <CommandItem
                  key={gun.id}
                  value={gun.name}
                  onSelect={(currentValue) => {
                    setGunId(gunLookup.get(currentValue)?.id ?? -1);
                    setAppState({ selectedId: gun.id });
                    setOpen(false);
                  }}
                >
                  <div className="w-12 flex justify-center">
                    <AnimatedSprite animation={gun.animation} scale={1} />
                  </div>
                  <span className="truncate whitespace-nowrap overflow-hidden">{gun.name}</span>
                  <Check className={cn("ml-auto", gunId === gun.id ? "opacity-100" : "opacity-0")} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

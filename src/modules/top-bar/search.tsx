"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useGuns, useSelectedGun } from "../shared/hooks/useGuns";
import { AnimatedSprite } from "../shared/components/animated-sprite";
import { useAppStateMutation } from "../shared/hooks/useAppStateMutation";
import { Muted } from "@/components/ui/typography";
import type { TGun } from "@/client/generated/models/gun.model";

function filterQuery(value: string, search: string) {
  const queryWords = search.toLowerCase().split(/\s+/).filter(Boolean);
  const target = value.toLowerCase();

  const allMatch = queryWords.every((query) => target.includes(query));
  return allMatch ? 1 : 0;
}

function getDisplayName(gun: TGun, gunLookup: Map<string, TGun[]>) {
  const matches = gunLookup.get(gun.name);
  if (!matches || matches?.length === 1) return gun.name;

  return `${gun.name} (${gun.id})`;
}

function getNameComponent(gun: TGun, gunLookup: Map<string, TGun[]>) {
  const matches = gunLookup.get(gun.name);
  if (!matches || matches?.length === 1) return gun.name;

  return (
    <div className="line-clamp-2 overflow-hidden flex gap-1">
      <span>{gun.name}</span> <Muted>({gun.id})</Muted>
    </div>
  );
}

export function Search() {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const selectedGun = useSelectedGun();
  const setAppState = useAppStateMutation();
  const guns = useGuns();
  const sortedGuns = React.useMemo(() => [...guns].sort((a, b) => a.name.localeCompare(b.name)), [guns]);
  const gunLookup = React.useMemo(() => {
    const lookup = new Map<string, TGun[]>();
    for (const gun of sortedGuns) {
      if (!lookup.has(gun.name)) {
        lookup.set(gun.name, []);
      }
      lookup.get(gun.name)?.push(gun);
    }
    return lookup;
  }, [sortedGuns]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-[250px] justify-between">
          <div className="flex items-center gap-2">
            {selectedGun && (
              <div className="w-12 flex justify-center">
                <AnimatedSprite key={selectedGun.id} animation={selectedGun.animation} scale={1} />
              </div>
            )}
            {selectedGun?.name ?? "Find gun..."}
          </div>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search gun..." value={search} onValueChange={setSearch} />
          <CommandList>
            <CommandEmpty>No gun found.</CommandEmpty>
            <CommandGroup>
              {sortedGuns
                .filter((gun) => filterQuery(getDisplayName(gun, gunLookup), search))
                .slice(0, 9)
                .map((gun) => (
                  <CommandItem
                    key={gun.id}
                    value={gun.id.toString()}
                    onSelect={() => {
                      setAppState({ selectedId: gun.id });
                      setOpen(false);
                    }}
                  >
                    <div className="w-12 flex justify-center">
                      <AnimatedSprite animation={gun.animation} scale={1} />
                    </div>
                    {getNameComponent(gun, gunLookup)}
                    <Check className={cn("ml-auto", selectedGun.id === gun.id ? "opacity-100" : "opacity-0")} />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

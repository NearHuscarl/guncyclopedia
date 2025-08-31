import { useMemo } from "react";
import cloneDeep from "lodash/cloneDeep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorItem } from "../top-bar/shared/components/color-item";
import type { TGun } from "@/client/generated/models/gun.model";
import type { TGunStats } from "@/client/service/gun.service";

type TDebugDataProps = {
  gun: TGun;
  stats: TGunStats;
};

export function DebugData({ gun, stats }: TDebugDataProps) {
  const debugData = useMemo(() => {
    const clonedGun = cloneDeep(gun) as Partial<TGun>;

    delete clonedGun.animation;
    delete clonedGun.colors;

    const clonedStats = cloneDeep(stats) as Partial<TGunStats>;

    delete clonedStats.projectile?.animation;

    clonedStats.mode?.volley.forEach((module) => {
      module.projectiles.forEach((p) => {
        delete p.animation;
      });
    });

    const { projectile, ...clonedStats2 } = clonedStats;

    return { gun: clonedGun, stats: clonedStats2, projectile };
  }, [gun, stats]);

  return (
    <Tabs defaultValue="gun">
      <TabsList>
        <TabsTrigger value="gun">Gun</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="projectile">AgProj</TabsTrigger>
      </TabsList>
      <TabsContent value="gun">
        <div className="flex gap-4">
          {gun.colors.map((c) => (
            <ColorItem key={c} color={c} />
          ))}
        </div>
        <pre className="text-left break-words whitespace-pre-wrap text-xs">
          {JSON.stringify(debugData.gun, null, 2)}
        </pre>
      </TabsContent>
      <TabsContent value="stats">
        <pre className="text-left break-words whitespace-pre-wrap text-xs">
          {JSON.stringify(debugData.stats, null, 2)}
        </pre>
      </TabsContent>
      <TabsContent value="projectile">
        <pre className="text-left break-words whitespace-pre-wrap text-xs">
          {JSON.stringify(debugData.projectile, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
  );
}

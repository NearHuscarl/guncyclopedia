import { useMemo } from "react";
import cloneDeep from "lodash/cloneDeep";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorItem } from "../top-bar/shared/components/color-item";
import { JsonViewer } from "../shared/components/json-viewer";
import type { TGun } from "@/client/generated/models/gun.model";
import type { TGunStats } from "@/client/service/gun.service";

type TDebugDataProps = {
  gun: TGun;
  stats: TGunStats;
  indices: {
    modeIndex: number;
    moduleIndex: number;
    projectileIndex: number;
    finalProjectileIndex: number;
  };
};

export function DebugData({ gun, stats, indices }: TDebugDataProps) {
  const debugData = useMemo(() => {
    const clonedGun = cloneDeep(gun) as Partial<TGun>;

    delete clonedGun.animation;
    delete clonedGun.colors;

    const clonedStats = cloneDeep(stats) as Partial<TGunStats>;

    delete clonedStats.projectile?.animation;

    clonedStats.mode?.volley.forEach((module) => {
      module.projectiles.forEach((p) => delete p.animation);
      module.finalProjectiles.forEach((p) => delete p.animation);
    });

    const { projectile, ...clonedStats2 } = clonedStats;

    return { gun: clonedGun, stats: clonedStats2, projectile };
  }, [gun, stats]);

  return (
    <Tabs className="mt-1" defaultValue="gun">
      <TabsList>
        <TabsTrigger value="gun">Gun</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
        <TabsTrigger value="projectile">AgProj</TabsTrigger>
        <TabsTrigger value="indices">Indices</TabsTrigger>
      </TabsList>
      <TabsContent value="gun">
        <div className="flex gap-4">
          {gun.colors.map((c) => (
            <ColorItem key={c} color={c} />
          ))}
        </div>
        <JsonViewer data={debugData.gun} />
      </TabsContent>
      <TabsContent value="stats">
        <JsonViewer data={debugData.stats} />
      </TabsContent>
      <TabsContent value="projectile">
        <JsonViewer data={debugData.projectile} />
      </TabsContent>
      <TabsContent value="indices">
        <JsonViewer data={indices} />
      </TabsContent>
    </Tabs>
  );
}

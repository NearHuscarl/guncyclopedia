import type { TProjectilePerShot } from "@/client/generated/models/gun.model";

type TShootStyleItemProps = {
  value?: TProjectilePerShot["shootStyle"] | "None";
  size?: "small";
};

export function ShootStyleItem({ value = "None" }: TShootStyleItemProps) {
  return <div className="uppercase">{value}</div>;
}

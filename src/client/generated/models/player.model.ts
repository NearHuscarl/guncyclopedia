import z from "zod/v4";

export const PlayerName = z.enum([
  "PlayerBullet",
  "PlayerConvict",
  "PlayerCoopCultist",
  "PlayerCosmonaut",
  "PlayerEevee",
  "PlayerGuide",
  "PlayerGunslinger",
  "PlayerLamey",
  "PlayerMarine",
  "PlayerNinja",
  "PlayerRobot",
  "PlayerRogue",
  "PlayerRogueMines",
]);

export type TPlayerName = z.infer<typeof PlayerName>;

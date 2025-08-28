import { memo, useMemo } from "react";
import clsx from "clsx";
import { useImageSize } from "./use-image-size";
import { useFrame } from "./use-frame";
import { useIsDebug } from "../hooks/useDebug";
import type { TAnimation } from "@/client/generated/models/animation.model";
import type { TPosition } from "@/client/generated/models/schema";

type TSize = { w: number; h: number };

function normQuarterTurn(deg: number, flipped: boolean): 0 | 90 | 180 | 270 {
  const r = (deg + 360 + (flipped ? 90 : 0)) % 360;
  if (r < 45) return 0;
  if (r < 135) return 90;
  if (r < 225) return 180;
  if (r < 315) return 270;
  return 0;
}

function buildTransform(rotate: 0 | 90 | 180 | 270, flipped: boolean, spriteSize: TSize, offset: TPosition) {
  const transformParts: string[] = [];
  const sw = spriteSize.w,
    sh = spriteSize.h;

  if (flipped) {
    transformParts.push("scaleX(-1)", `translate(${sw}px, 0px)`);
  }
  // https://www.figma.com/design/loAXQ0w6kwPLrqCcMuwZig/Guncyclopedia-Icons?node-id=110-48&t=S4tL5fDB9wrvCncb-4
  if (rotate === 90) {
    transformParts.push("rotate(90deg)", `translate(${sh}px, 0px)`);
  }
  if (rotate === 180) {
    transformParts.push("rotate(180deg)", `translate(${sw}px, ${sh}px)`);
  }
  if (rotate === 270) {
    transformParts.push("rotate(270deg)", `translate(0px, ${sh}px)`);
  }

  transformParts.push(`translate(${offset.x}px, ${offset.y}px)`);

  // transform is applied from right to left
  return transformParts.reverse().join(" ");
}

function getMaxDimensions(animation: TAnimation, w: number, h: number, scale: number) {
  let maxW = 0;
  let maxH = 0;

  for (const frame of animation.frames) {
    const uvs = frame.uvs;
    const x0 = Math.min(...uvs.map((p) => p.x));
    const y0 = Math.min(...uvs.map((p) => p.y));
    const x1 = Math.max(...uvs.map((p) => p.x));
    const y1 = Math.max(...uvs.map((p) => p.y));

    const spriteW = (x1 - x0) * w * scale;
    const spriteH = (y1 - y0) * h * scale;

    const rot = normQuarterTurn(animation.rotate ?? 0, frame.flipped);
    const frameW = rot === 90 || rot === 270 ? spriteH : spriteW;
    const frameH = rot === 90 || rot === 270 ? spriteW : spriteH;

    maxW = Math.max(maxW, frameW);
    maxH = Math.max(maxH, frameH);
  }

  return { maxW, maxH };
}

type TAnimatedSpriteProps = { animation: TAnimation; scale?: number; className?: string; onFinished?: () => void };

function AnimatedSpriteImpl({ animation, scale = 1, className, onFinished }: TAnimatedSpriteProps) {
  const frame = useFrame(animation, onFinished);
  const debug = useIsDebug();
  const { w, h } = useImageSize(animation.texturePath);
  const { maxW, maxH } = useMemo(() => getMaxDimensions(animation, w, h, scale), [animation, h, scale, w]);

  // uvs are normalized coordinates in the range [0, 1]
  // top-left is (0, 0), bottom-right is (1, 1)
  const uvs = frame.uvs;
  const x0 = Math.min(...uvs.map((p) => p.x));
  const y0 = Math.min(...uvs.map((p) => p.y));
  const x1 = Math.max(...uvs.map((p) => p.x));
  const y1 = Math.max(...uvs.map((p) => p.y));

  // current frame box (pre-rotation)
  const spriteW = (x1 - x0) * w * scale;
  const spriteH = (y1 - y0) * h * scale;

  const bgPosX = -x0 * w * scale;
  const bgPosY = -y0 * h * scale;
  const bgSizeW = w * scale;
  const bgSizeH = h * scale;

  // normalize rotation to a quarter turn
  const rotate = normQuarterTurn(animation.rotate ?? 0, frame.flipped);

  // axis-aligned box after rotation (flip doesn't alter size)
  const effW = rotate === 90 || rotate === 270 ? spriteH : spriteW;
  const effH = rotate === 90 || rotate === 270 ? spriteW : spriteH;

  // center the final AABB
  const offX = (maxW - effW) / 2;
  const offY = (maxH - effH) / 2;

  const transform = buildTransform(rotate, frame.flipped, { w: spriteW, h: spriteH }, { x: offX, y: offY });

  return (
    <div
      className={clsx(className, { "border border-secondary": debug })}
      style={{
        width: maxW,
        height: maxH,
        position: "relative",
        overflow: "hidden",

        // these keep transforms isolated and cheap
        contain: "layout paint size",
      }}
    >
      <div
        className={clsx({ "border border-primary": debug })}
        style={{
          width: spriteW,
          height: spriteH,
          background: `url(${animation.texturePath})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `left ${bgPosX}px bottom ${bgPosY}px`,
          backgroundSize: `${bgSizeW}px ${bgSizeH}px`,
          imageRendering: "pixelated",
          // skip painting when offscreen
          contentVisibility: "auto",

          position: "absolute",
          top: 0,
          left: 0,

          // critical: anchor math to (0,0)
          transformOrigin: "0 0",
          transform,
          willChange: "transform",
        }}
      />
    </div>
  );
}

export const AnimatedSprite = memo(AnimatedSpriteImpl, (prev, next) => {
  return prev.animation.name === next.animation.name && prev.scale === next.scale;
});

import { memo, useMemo } from "react";
import clsx from "clsx";
import { useImageSize } from "./use-image-size";
import type { TGun } from "@/client/generated/models/gun.model";
import { useIsDebug } from "@/lib/hooks";
import { useFrame } from "./use-frame";

function getMaxDimensions(animation: TGun["animation"], w: number, h: number, scale: number) {
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

    const frameW = frame.flipped ? spriteH : spriteW;
    const frameH = frame.flipped ? spriteW : spriteH;

    maxW = Math.max(maxW, frameW);
    maxH = Math.max(maxH, frameH);
  }

  return { maxW, maxH };
}

type TAnimatedSpriteProps = { animation: TGun["animation"]; scale?: number };

function AnimatedSpriteImpl({ animation, scale = 1 }: TAnimatedSpriteProps) {
  const frame = useFrame(animation);

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
  const spriteW = (x1 - x0) * w;
  const spriteH = (y1 - y0) * h;

  const cssW = spriteW * scale;
  const cssH = spriteH * scale;

  const bgPosX = -x0 * w * scale;
  const bgPosY = -y0 * h * scale;
  const bgSizeW = w * scale;
  const bgSizeH = h * scale;

  // axis-aligned box after the flip/rotate
  const effW = frame.flipped ? cssH : cssW;
  const effH = frame.flipped ? cssW : cssH;

  // center that AABB inside the max box
  const offX = (maxW - effW) / 2;
  const offY = (maxH - effH) / 2;

  // Build transform with origin at top-left.
  // For flipped = false: just move into place.
  // For flipped = true: rotate 90° CW, then push down by original width (cssW),
  // then mirror horizontally (scaleX(-1)) which moves to negative X, then push right by cssH.
  // Finally, add the centering offset (offX, offY).
  const transform = frame.flipped
    ? // order is left→right in code but applied right→left by CSS
      `translate(${offX}px, ${offY}px) translate(${effW}px, ${effH}px) rotate(90deg) scaleX(-1)`
    : `translate(${offX}px, ${offY}px)`;
  const debug = useIsDebug();

  return (
    <div
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
          width: cssW,
          height: cssH,
          background: `url(${animation.texturePath})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `left ${bgPosX}px bottom ${bgPosY}px`,
          backgroundSize: `${bgSizeW}px ${bgSizeH}px`,
          imageRendering: "pixelated",

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

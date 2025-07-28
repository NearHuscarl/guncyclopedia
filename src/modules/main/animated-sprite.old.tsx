import { useEffect, useMemo, useState } from "react";
import { useImageSize } from "./use-image-size";
import type { TGun } from "@/client/generated/models/gun.model";

function useFrame(animation: TGun["animation"]) {
  const [index, setIndex] = useState(animation.loopStart);

  useEffect(() => {
    if (animation.frames.length === 0) return;

    const interval = 1000 / animation.fps;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % animation.frames.length);
    }, interval);

    return () => window.clearInterval(id);
  }, [animation.fps, animation.frames.length, animation.name]);

  return animation.frames[index];
}

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

export function AnimatedSprite({ animation, scale = 1 }: TAnimatedSpriteProps) {
  const frame = useFrame(animation);

  const { w, h } = useImageSize(animation.texturePath);
  const { maxW, maxH } = useMemo(() => getMaxDimensions(animation, w, h, scale), [animation.name, scale]);

  // uvs are normalized coordinates in the range [0, 1]
  // top-left is (0, 0), bottom-right is (1, 1)
  const uvs = frame.uvs;
  const x0 = Math.min(...uvs.map((p) => p.x));
  const y0 = Math.min(...uvs.map((p) => p.y));
  const x1 = Math.max(...uvs.map((p) => p.x));
  const y1 = Math.max(...uvs.map((p) => p.y));

  // sprite's own pixel dimensions
  const spriteW = (x1 - x0) * w;
  const spriteH = (y1 - y0) * h;

  // convert everything to CSS pixels, applying uniform scale
  const cssW = spriteW * scale;
  const cssH = spriteH * scale;
  const bgPosX = -x0 * w * scale;
  const bgPosY = -y0 * h * scale;
  const bgSizeW = w * scale;
  const bgSizeH = h * scale;

  let transform = "";
  if (frame.flipped) {
    // rotate 90° clockwise *and* mirror horizontally
    // then nudge so the sprite's own centre stays fixed
    const dx = (cssH - cssW) / 2; // positive → right, negative → left
    const dy = (cssW - cssH) / 2; // positive → down,  negative → up

    transform = `translate(${dx}px, ${dy}px) rotate(90deg) scaleX(-1)`;
  }

  return (
    <div
      className="bg-gray-200"
      style={{
        width: maxW,
        height: maxH,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          border: "1px solid #ccc",
          width: cssW,
          height: cssH,
          background: `url(${animation.texturePath})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: `left ${bgPosX}px bottom ${bgPosY}px`,
          backgroundSize: `${bgSizeW}px ${bgSizeH}px`,
          imageRendering: "pixelated",
          transform,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />
    </div>
  );
}

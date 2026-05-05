import { Link } from "react-router-dom";
import { useState, useEffect, useMemo, useRef } from "react";
import ItemShape from "./ItemShape";
import type { Item } from "../types/Item";

type Props = {
  items: Item[];
  radius?: number;
  itemSize?: number;
  centerSize?: number;
  faceInward?: boolean;
};

function getItemKey(item: Item): string {
  return `${item._id}-${item.title}-${item.author_first}-${item.author_last}`;
}

function getStableItemScore(item: Item, seed: number): number {
  const key = `${seed}-${getItemKey(item)}`;
  let hash = 0;

  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function useMinWidth(minWidth: number): boolean {
  const [matches, setMatches] = useState<boolean>(
    window.matchMedia(`(min-width: ${minWidth}px)`).matches
  );

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${minWidth}px)`);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, [minWidth]);

  return matches;
}

export default function HomeShapes({

  items,
  radius = 180,
  itemSize = 140,
  centerSize = 500,
  faceInward = false,
}: Props) {
  const center = centerSize / 2;

  const [rotateOffset, setRotateOffset] = useState(0);
  const [mobileRotateOffset, setMobileRotateOffset] = useState(0);
  const [displaySeed] = useState(() => Math.floor(Math.random() * Number.MAX_SAFE_INTEGER));
  const targetRef = useRef(0); // 👈 where we want to go
  const mobileTargetRef = useRef(0);
  const mobileCurrentRef = useRef(0);
  const mobileSettleTimeoutRef = useRef<number | null>(null);
  const mobileTouchYRef = useRef(0);
  const isDesktop = useMinWidth(768);

  const displayItems = useMemo(() => {
    return [...items]
      .sort(
        (firstItem, secondItem) =>
          getStableItemScore(firstItem, displaySeed) - getStableItemScore(secondItem, displaySeed)
      )
      .slice(0, 6);
  }, [displaySeed, items]);

  const mobileItem = displayItems[0] ?? null;

  // Wheel updates TARGET (not state directly)
  useEffect(() => {
  if (!isDesktop) return;

  const handleWheel = (e: WheelEvent) => {
    targetRef.current += e.deltaY * 0.5;
  };

  window.addEventListener("wheel", handleWheel);

  return () => {
    window.removeEventListener("wheel", handleWheel);
  };
}, [isDesktop]);

  // Smooth animation loop
  useEffect(() => {
  if (!isDesktop) return;

  let frame: number;

  const animate = () => {
    setRotateOffset((prev) => {
      const diff = targetRef.current - prev;
      return prev + diff * 0.08;
    });

    frame = requestAnimationFrame(animate);
  };

  animate();

  return () => cancelAnimationFrame(frame);
}, [isDesktop]);

useEffect(() => {
  if (!isDesktop) {
    targetRef.current = 0;
    setRotateOffset(0);
  }
}, [isDesktop]);

useEffect(() => {
  if (isDesktop) {
    mobileTargetRef.current = 0;
    mobileCurrentRef.current = 0;
    setMobileRotateOffset(0);
    return;
  }

  const rotateMobileShape = (delta: number) => {
    if (Math.abs(delta) < 1.5) {
      return;
    }

    const cappedDelta = Math.max(-18, Math.min(18, delta));
    mobileTargetRef.current += cappedDelta * 0.5;

    if (mobileSettleTimeoutRef.current) {
      window.clearTimeout(mobileSettleTimeoutRef.current);
    }

    mobileSettleTimeoutRef.current = window.setTimeout(() => {
      mobileTargetRef.current = mobileCurrentRef.current;
    }, 90);
  };

  const handleWheel = (event: WheelEvent) => {
    rotateMobileShape(event.deltaY);
  };

  const handleTouchStart = (event: TouchEvent) => {
    if (event.touches.length === 0) {
      return;
    }

    mobileTouchYRef.current = event.touches[0].clientY;
  };

  const handleTouchMove = (event: TouchEvent) => {
    if (event.touches.length === 0) {
      return;
    }

    const nextTouchY = event.touches[0].clientY;
    rotateMobileShape(mobileTouchYRef.current - nextTouchY);
    mobileTouchYRef.current = nextTouchY;
  };

  window.addEventListener("wheel", handleWheel, { passive: true });
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchmove", handleTouchMove, { passive: true });

  return () => {
    window.removeEventListener("wheel", handleWheel);
    window.removeEventListener("touchstart", handleTouchStart);
    window.removeEventListener("touchmove", handleTouchMove);

    if (mobileSettleTimeoutRef.current) {
      window.clearTimeout(mobileSettleTimeoutRef.current);
    }
  };
}, [isDesktop]);

useEffect(() => {
  if (isDesktop) return;

  let frame: number;

  const animate = () => {
    setMobileRotateOffset((currentOffset) => {
      const diff = mobileTargetRef.current - currentOffset;

      if (Math.abs(diff) < 0.02) {
        mobileCurrentRef.current = mobileTargetRef.current;
        return mobileTargetRef.current;
      }

      const nextOffset = currentOffset + diff * 0.16;
      mobileCurrentRef.current = nextOffset;
      return nextOffset;
    });

    frame = requestAnimationFrame(animate);
  };

  animate();

  return () => cancelAnimationFrame(frame);
}, [isDesktop]);

  return (
    <>
      <div className="mobile-shape-container mobile-only">
        <div
          className="mobile-only"
          style={{
            width: itemSize,
            height: itemSize,
          }}
        >
          {mobileItem && (
            <div
              key={mobileItem._id}
              style={{
                width: itemSize,
                height: itemSize,
                transform: `rotate(${mobileRotateOffset}deg)`,
                transformOrigin: "center",
              }}
            >
              <Link to={`/catalog/item/${mobileItem._id}`}>
                <ItemShape shape={mobileItem.shape} size={itemSize} />
              </Link>
            </div>
          )}
        </div>
      </div>
      <div
        className="desktop-only"
        style={{
          position: "relative",
          width: centerSize,
          height: centerSize,
          margin: "0 auto",
        }}
      >
        {displayItems.map((item, index) => {
          const angle = (index / displayItems.length) * 360 + rotateOffset;
          const rotation = faceInward ? angle + 180 : angle;

          return (
            <div
              key={item._id}
              style={{
                position: "absolute",
                width: itemSize,
                height: itemSize,
                top: center,
                left: center,
                transform: `
                translate(-50%, -50%)
                rotate(${angle}deg)
                translate(0, -${radius}px)
                rotate(${rotation}deg)
              `,
                transformOrigin: "center",
              }}
            >
              <Link to={`/catalog/item/${item._id}`}>
                <ItemShape shape={item.shape} size={itemSize} />
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}

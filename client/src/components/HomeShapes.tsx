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
  const targetRef = useRef(0); // 👈 where we want to go
  const isDesktop = useMinWidth(768);

  // Select 6 random items
  const randomItems = useMemo(() => {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }, [items]);

  const randomItem = useMemo(() => {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}, [items]);

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
          {randomItem && (
            <div
              key={randomItem._id}
              style={{
                width: itemSize,
                height: itemSize
              }}
            >
              <Link to={`/catalog/item/${randomItem._id}`}>
                <ItemShape shape={randomItem.shape} size={itemSize} />
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
        {randomItems.map((item, index) => {
          const angle = (index / randomItems.length) * 360 + rotateOffset;
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

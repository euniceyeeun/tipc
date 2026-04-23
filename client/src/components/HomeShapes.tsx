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

  // Select 6 random items
  const randomItems = useMemo(() => {
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 6);
  }, [items]);

  // Wheel updates TARGET (not state directly)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      targetRef.current += e.deltaY * 0.5;
    };

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  // Smooth animation loop
  useEffect(() => {
    let frame: number;

    const animate = () => {
      setRotateOffset((prev) => {
        const diff = targetRef.current - prev;
        return prev + diff * 0.08; // 👈 smoothing factor
      });

      frame = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
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
  );
}

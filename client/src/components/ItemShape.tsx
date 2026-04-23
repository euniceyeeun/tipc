type Point = {
  x: number;
  y: number;
};

type Shape = {
  points: Point[];
  closed: boolean;
};

type Props = {
  shape?: Shape;
  size?: number; // allows different sizes (catalog vs detail)
};

function ItemShape({ shape, size = 200 }: Props) {
  if (!shape?.points?.length) return null;

  const xs = shape.points.map((p) => p.x);
  const ys = shape.points.map((p) => p.y);

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  const shapeWidth = maxX - minX;
  const shapeHeight = maxY - minY;

  const margin = 30;

  const scale = Math.min(
    (size - 2 * margin) / shapeWidth,
    (size - 2 * margin) / shapeHeight
  );

  const offsetX = (size - shapeWidth * scale) / 2 - minX * scale;
  const offsetY = (size - shapeHeight * scale) / 2 - minY * scale;

  const pathData =
    shape.points
      .map((p, i) => {
        const x = p.x * scale + offsetX;
        const y = p.y * scale + offsetY;
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + (shape.closed ? " Z" : "");

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d={pathData} fill="#000000" stroke="none" />
    </svg>
  );
}

export default ItemShape;
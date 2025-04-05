export const isSubsetOf = <T>(a: Set<T>, b: Set<T>) => {
  for (const value of a) if (!b.has(value)) return false;
  return true;
};

export const shallowArrayEquals = <T>(a: T[], b: T[]) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

export type Point = { x: number; y: number };

const det = (
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number,
  g: number,
  h: number,
  i: number,
): number => a * e * i + b * f * g + c * d * h - a * f * h - b * d * i - c * e * g;

export const circleFromThreePoints = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
): { x: number; y: number; radius: number } => {
  const a = det(x1, y1, 1, x2, y2, 1, x3, y3, 1);
  const bx = -det(x1 * x1 + y1 * y1, y1, 1, x2 * x2 + y2 * y2, y2, 1, x3 * x3 + y3 * y3, y3, 1);
  const by = det(x1 * x1 + y1 * y1, x1, 1, x2 * x2 + y2 * y2, x2, 1, x3 * x3 + y3 * y3, x3, 1);
  const c = -det(x1 * x1 + y1 * y1, x1, y1, x2 * x2 + y2 * y2, x2, y2, x3 * x3 + y3 * y3, x3, y3);
  return {
    x: -bx / (2 * a),
    y: -by / (2 * a),
    radius: Math.sqrt(bx * bx + by * by - 4 * a * c) / (2 * Math.abs(a)),
  };
};

export const fixed = (number: number, digits: number) => {
  return number.toFixed(digits).replace(/0+$/, "").replace(/\.$/, "");
};

export const lineParallel = (
  start: Point,
  end: Point,
  distance: number,
): { start: Point; end: Point } => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const nx = (dx * distance) / length;
  const ny = (dy * distance) / length;

  return {
    start: { x: start.x + ny, y: start.y - nx },
    end: { x: end.x + ny, y: end.y - nx },
  };
};

export const lineTween = (start: Point, end: Point, fraction: number) => ({
  x: start.x + fraction * (end.x - start.x),
  y: start.y + fraction * (end.y - start.y),
});

export const arcTween = (
  startAngle: number,
  endAngle: number,
  radius: number,
  circle: Point,
  clockwise: boolean,
  fraction: number,
) => {
  function getDeltaAngle(start: number, end: number, clockwise: boolean) {
    let delta = end - start;
    if (clockwise) {
      if (delta > 0) {
        delta -= 2 * Math.PI;
      }
    } else {
      if (delta < 0) {
        delta += 2 * Math.PI;
      }
    }
    return delta;
  }

  const angle = startAngle + fraction * getDeltaAngle(startAngle, endAngle, clockwise);

  const x = circle.x + radius * Math.cos(angle);
  const y = circle.y + radius * Math.sin(angle);

  return { x, y };
};

export const easeInOutQuad = (x: number): number => {
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};

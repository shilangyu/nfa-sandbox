import { arcTween, circleFromThreePoints, lineParallel, lineTween, Point } from "../utils";
import { Component, DrawingContext } from "./component";
import { drawArrow, drawText } from "./drawing";
import { Node } from "./node";

export class Link implements Component {
  nodeA: Node;
  nodeB: Node;
  text: string = "";
  lineAngleAdjust = 0; // value to add to textAngle when link is straight line
  // make anchor point relative to the locations of nodeA and nodeB
  parallelPart = 0.5; // percentage from nodeA to nodeB
  perpendicularPart = 0; // pixels from line between nodeA and nodeB

  constructor(a: Node, b: Node) {
    this.nodeA = a;
    this.nodeB = b;
  }

  getAnchorPoint() {
    const dx = this.nodeB.x - this.nodeA.x;
    const dy = this.nodeB.y - this.nodeA.y;
    const scale = Math.sqrt(dx * dx + dy * dy);
    return {
      x: this.nodeA.x + dx * this.parallelPart - (dy * this.perpendicularPart) / scale,
      y: this.nodeA.y + dy * this.parallelPart + (dx * this.perpendicularPart) / scale,
    };
  }

  setAnchorPoint(x: number, y: number, snapToPadding: number) {
    const dx = this.nodeB.x - this.nodeA.x;
    const dy = this.nodeB.y - this.nodeA.y;
    const scale = Math.sqrt(dx * dx + dy * dy);
    this.parallelPart = (dx * (x - this.nodeA.x) + dy * (y - this.nodeA.y)) / (scale * scale);
    this.perpendicularPart = (dx * (y - this.nodeA.y) - dy * (x - this.nodeA.x)) / scale;

    // snap to a straight line
    if (
      this.parallelPart > 0 &&
      this.parallelPart < 1 &&
      Math.abs(this.perpendicularPart) < snapToPadding
    ) {
      this.lineAngleAdjust = (this.perpendicularPart < 0 ? 1 : 0) * Math.PI;
      this.perpendicularPart = 0;
    }
  }

  getEndPointsAndCircle():
    | {
        hasCircle: false;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
      }
    | {
        hasCircle: true;
        startX: number;
        startY: number;
        endX: number;
        endY: number;
        startAngle: number;
        endAngle: number;
        circleX: number;
        circleY: number;
        circleRadius: number;
        reverseScale: number;
        isReversed: boolean;
      } {
    if (this.perpendicularPart === 0) {
      const midX = (this.nodeA.x + this.nodeB.x) / 2;
      const midY = (this.nodeA.y + this.nodeB.y) / 2;
      const start = this.nodeA.closestPointOnCircle(midX, midY);
      const end = this.nodeB.closestPointOnCircle(midX, midY);
      return {
        hasCircle: false,
        startX: start.x,
        startY: start.y,
        endX: end.x,
        endY: end.y,
      };
    }

    const anchor = this.getAnchorPoint();
    const circle = circleFromThreePoints(
      this.nodeA.x,
      this.nodeA.y,
      this.nodeB.x,
      this.nodeB.y,
      anchor.x,
      anchor.y,
    );
    const isReversed = this.perpendicularPart > 0;
    const reverseScale = isReversed ? 1 : -1;
    const startAngle =
      Math.atan2(this.nodeA.y - circle.y, this.nodeA.x - circle.x) -
      (reverseScale * Node.radius) / circle.radius;
    const endAngle =
      Math.atan2(this.nodeB.y - circle.y, this.nodeB.x - circle.x) +
      (reverseScale * Node.radius) / circle.radius;
    const startX = circle.x + circle.radius * Math.cos(startAngle);
    const startY = circle.y + circle.radius * Math.sin(startAngle);
    const endX = circle.x + circle.radius * Math.cos(endAngle);
    const endY = circle.y + circle.radius * Math.sin(endAngle);

    return {
      hasCircle: true,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      startAngle: startAngle,
      endAngle: endAngle,
      circleX: circle.x,
      circleY: circle.y,
      circleRadius: circle.radius,
      reverseScale: reverseScale,
      isReversed: isReversed,
    };
  }

  draw(c: DrawingContext, hasFocus: boolean, isSelected: boolean) {
    const stuff = this.getEndPointsAndCircle();

    // draw arc
    c.beginPath();
    if (stuff.hasCircle) {
      c.arc(
        stuff.circleX,
        stuff.circleY,
        stuff.circleRadius,
        stuff.startAngle,
        stuff.endAngle,
        stuff.isReversed,
      );
    } else {
      c.moveTo(stuff.startX, stuff.startY);
      c.lineTo(stuff.endX, stuff.endY);
    }
    c.stroke();

    // draw the head of the arrow
    if (stuff.hasCircle) {
      drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle - stuff.reverseScale * (Math.PI / 2));
    } else {
      drawArrow(
        c,
        stuff.endX,
        stuff.endY,
        Math.atan2(stuff.endY - stuff.startY, stuff.endX - stuff.startX),
      );
    }

    // draw the text
    if (stuff.hasCircle) {
      let startAngle = stuff.startAngle;
      let endAngle = stuff.endAngle;
      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      const textAngle = (startAngle + endAngle) / 2 + (stuff.isReversed ? 1 : 0) * Math.PI;
      const textX = stuff.circleX + stuff.circleRadius * Math.cos(textAngle);
      const textY = stuff.circleY + stuff.circleRadius * Math.sin(textAngle);
      drawText(c, this.text, textX, textY, textAngle, isSelected, hasFocus);
    } else {
      const textX = (stuff.startX + stuff.endX) / 2;
      const textY = (stuff.startY + stuff.endY) / 2;
      const textAngle = Math.atan2(stuff.endX - stuff.startX, stuff.startY - stuff.endY);
      drawText(c, this.text, textX, textY, textAngle + this.lineAngleAdjust, isSelected, hasFocus);
    }
  }

  containsPoint(x: number, y: number, hitTargetPadding: number): boolean {
    const stuff = this.getEndPointsAndCircle();

    if (stuff.hasCircle) {
      const dx = x - stuff.circleX;
      const dy = y - stuff.circleY;
      const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;

      if (Math.abs(distance) < hitTargetPadding) {
        let angle = Math.atan2(dy, dx);
        let startAngle = stuff.startAngle;
        let endAngle = stuff.endAngle;

        if (stuff.isReversed) {
          const temp = startAngle;
          startAngle = endAngle;
          endAngle = temp;
        }

        if (endAngle < startAngle) {
          endAngle += Math.PI * 2;
        }

        if (angle < startAngle) {
          angle += Math.PI * 2;
        } else if (angle > endAngle) {
          angle -= Math.PI * 2;
        }

        return angle > startAngle && angle < endAngle;
      }
    } else {
      const dx = stuff.endX - stuff.startX;
      const dy = stuff.endY - stuff.startY;
      const length = Math.sqrt(dx * dx + dy * dy);
      const percent = (dx * (x - stuff.startX) + dy * (y - stuff.startY)) / (length * length);
      const distance = (dx * (y - stuff.startY) - dy * (x - stuff.startX)) / length;

      return percent > 0 && percent < 1 && Math.abs(distance) < hitTargetPadding;
    }

    return false;
  }

  tween = (fraction: number, offset: number): Point => {
    const stuff = this.getEndPointsAndCircle();
    if (stuff.hasCircle) {
      return arcTween(
        stuff.startAngle,
        stuff.endAngle,
        stuff.circleRadius + offset,
        { x: stuff.circleX, y: stuff.circleY },
        stuff.isReversed,
        fraction,
      );
    } else {
      const { start, end } = lineParallel(
        { x: stuff.startX, y: stuff.startY },
        { x: stuff.endX, y: stuff.endY },
        offset,
      );

      return lineTween(start, end, fraction);
    }
  };
}

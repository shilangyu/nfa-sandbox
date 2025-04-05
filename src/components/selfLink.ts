import { arcTween, Point } from "../utils";
import { Component, DrawingContext } from "./component";
import { drawArrow, drawText } from "./drawing";
import { Node } from "./node";

export class SelfLink implements Component {
  node: Node;
  anchorAngle: number = 0;
  moveOffsetAngle: number = 0;
  text: string = "";

  constructor(node: Node, start: Point | undefined) {
    this.node = node;

    if (start) {
      this.setAnchorPoint(start.x, start.y);
    }
  }

  startNode = () => this.node;
  endNode = () => this.node;
  token = () => this.text;
  tokenPosition = () => {
    const stuff = this.getEndPointsAndCircle();
    const textX = stuff.circleX + stuff.circleRadius * Math.cos(this.anchorAngle);
    const textY = stuff.circleY + stuff.circleRadius * Math.sin(this.anchorAngle);
    return { x: textX, y: textY, angle: this.anchorAngle };
  };

  setMoveStart(x: number, y: number): void {
    this.moveOffsetAngle = this.anchorAngle - Math.atan2(y - this.node.y, x - this.node.x);
  }

  setAnchorPoint(x: number, y: number): void {
    this.anchorAngle = Math.atan2(y - this.node.y, x - this.node.x) + this.moveOffsetAngle;
    // snap to 90 degrees
    const snap = Math.round(this.anchorAngle / (Math.PI / 2)) * (Math.PI / 2);
    if (Math.abs(this.anchorAngle - snap) < 0.1) this.anchorAngle = snap;
    // keep in the range -pi to pi so our containsPoint() function always works
    if (this.anchorAngle < -Math.PI) this.anchorAngle += 2 * Math.PI;
    if (this.anchorAngle > Math.PI) this.anchorAngle -= 2 * Math.PI;
  }

  getEndPointsAndCircle() {
    const circleX = this.node.x + 1.5 * Node.radius * Math.cos(this.anchorAngle);
    const circleY = this.node.y + 1.5 * Node.radius * Math.sin(this.anchorAngle);
    const circleRadius = 0.75 * Node.radius;
    const startAngle = this.anchorAngle - Math.PI * 0.8;
    const endAngle = this.anchorAngle + Math.PI * 0.8;
    const startX = circleX + circleRadius * Math.cos(startAngle);
    const startY = circleY + circleRadius * Math.sin(startAngle);
    const endX = circleX + circleRadius * Math.cos(endAngle);
    const endY = circleY + circleRadius * Math.sin(endAngle);
    return {
      hasCircle: true,
      startX,
      startY,
      endX,
      endY,
      startAngle,
      endAngle,
      circleX,
      circleY,
      circleRadius,
    };
  }

  draw(c: DrawingContext, hasFocus: boolean, isSelected: boolean): void {
    const stuff = this.getEndPointsAndCircle();
    // draw arc
    c.beginPath();
    c.arc(
      stuff.circleX,
      stuff.circleY,
      stuff.circleRadius,
      stuff.startAngle,
      stuff.endAngle,
      false,
    );
    c.stroke();
    // draw the text on the loop farthest from the node
    const text = this.tokenPosition();
    drawText(c, this.text, text.x, text.y, text.angle, isSelected, hasFocus);
    // draw the head of the arrow
    drawArrow(c, stuff.endX, stuff.endY, stuff.endAngle + Math.PI * 0.4);
  }

  containsPoint(x: number, y: number, hitTargetPadding: number): boolean {
    const stuff = this.getEndPointsAndCircle();
    const dx = x - stuff.circleX;
    const dy = y - stuff.circleY;
    const distance = Math.sqrt(dx * dx + dy * dy) - stuff.circleRadius;
    return Math.abs(distance) < hitTargetPadding;
  }

  tween = (fraction: number, offset: number): Point => {
    const stuff = this.getEndPointsAndCircle();
    return arcTween(
      stuff.startAngle,
      stuff.endAngle,
      stuff.circleRadius + offset,
      { x: stuff.circleX, y: stuff.circleY },
      false,
      fraction,
    );
  };
}

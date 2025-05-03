import { Component, DrawingContext } from "./component";

export class Node implements Component {
  x: number;
  y: number;
  moveOffsetX: number = 0;
  moveOffsetY: number = 0;
  isAcceptState: boolean = false;

  static radius: number = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setMoveStart(x: number, y: number): void {
    this.moveOffsetX = this.x - x;
    this.moveOffsetY = this.y - y;
  }

  setAnchorPoint(x: number, y: number): void {
    this.x = x + this.moveOffsetX;
    this.y = y + this.moveOffsetY;
  }

  draw(c: DrawingContext, _hasFocus: boolean, _isSelected: boolean): void {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, Node.radius, 0, 2 * Math.PI, false);
    c.stroke();

    // draw a double circle for an accept state
    if (this.isAcceptState) {
      c.beginPath();
      c.arc(this.x, this.y, Node.radius - 6, 0, 2 * Math.PI, false);
      c.stroke();
    }
  }

  closestPointOnCircle(x: number, y: number): { x: number; y: number } {
    const dx = x - this.x;
    const dy = y - this.y;
    const scale = Math.sqrt(dx * dx + dy * dy);
    return {
      x: this.x + (dx * Node.radius) / scale,
      y: this.y + (dy * Node.radius) / scale,
    };
  }

  containsPoint(x: number, y: number): boolean {
    return (x - this.x) * (x - this.x) + (y - this.y) * (y - this.y) < Node.radius * Node.radius;
  }

  toggleAcceptState(): void {
    this.isAcceptState = !this.isAcceptState;
  }
}

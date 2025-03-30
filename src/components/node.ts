import { Component } from "./component";
import { drawText } from "./drawing";

export class Node implements Component {
  x: number;
  y: number;
  mouseOffsetX: number = 0;
  mouseOffsetY: number = 0;
  isAcceptState: boolean = false;
  text: string = "";

  static radius: number = 20;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  setMouseStart(x: number, y: number): void {
    this.mouseOffsetX = this.x - x;
    this.mouseOffsetY = this.y - y;
  }

  setAnchorPoint(x: number, y: number): void {
    this.x = x + this.mouseOffsetX;
    this.y = y + this.mouseOffsetY;
  }

  draw(c: CanvasRenderingContext2D, hasFocus: boolean, isSelected: boolean): void {
    // draw the circle
    c.beginPath();
    c.arc(this.x, this.y, Node.radius, 0, 2 * Math.PI, false);
    c.stroke();

    // draw the text
    drawText(c, this.text, this.x, this.y, undefined, isSelected, hasFocus);

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

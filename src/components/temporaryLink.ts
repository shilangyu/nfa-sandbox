import { Point } from "../geometry";
import { Component } from "./component";
import { drawArrow } from "./drawing";

export class TemporaryLink implements Component {
  from: Point;
  to: Point;

  constructor(from: Point, to: Point) {
    this.from = from;
    this.to = to;
  }

  draw(c: CanvasRenderingContext2D) {
    // draw the line
    c.beginPath();
    c.moveTo(this.to.x, this.to.y);
    c.lineTo(this.from.x, this.from.y);
    c.stroke();

    // draw the head of the arrow
    drawArrow(
      c,
      this.to.x,
      this.to.y,
      Math.atan2(this.to.y - this.from.y, this.to.x - this.from.x),
    );
  }
}

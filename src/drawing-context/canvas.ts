import { DrawingContext } from "../components/component";

export class CanvasDrawingContext implements DrawingContext {
  #ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.#ctx = ctx;
  }

  beginPath(): void {
    this.#ctx.beginPath();
  }

  moveTo(x: number, y: number): void {
    this.#ctx.moveTo(x, y);
  }

  lineTo(x: number, y: number): void {
    this.#ctx.lineTo(x, y);
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void {
    this.#ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
  }

  stroke(): void {
    this.#ctx.stroke();
  }

  fill(): void {
    this.#ctx.fill();
  }

  save(): void {
    this.#ctx.save();
  }

  restore(): void {
    this.#ctx.restore();
  }

  translate(x: number, y: number): void {
    this.#ctx.translate(x, y);
  }

  clearRect(x: number, y: number, width: number, height: number): void {
    this.#ctx.clearRect(x, y, width, height);
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.#ctx.fillText(text, x, y, maxWidth);
  }

  measureText(text: string): { width: number } {
    return this.#ctx.measureText(text);
  }

  set font(value: string) {
    this.#ctx.font = value;
  }

  set strokeStyle(value: string) {
    this.#ctx.strokeStyle = value;
  }

  set fillStyle(value: string) {
    this.#ctx.fillStyle = value;
  }

  set lineWidth(value: number) {
    this.#ctx.lineWidth = value;
  }

  async export(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.#ctx.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject("Failed to export canvas to blob");
        }
      });
    });
  }
}

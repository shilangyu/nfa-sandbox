import { DrawingContext } from "../components/component";
import { fixed } from "../utils";

export class SvgDrawingContext implements DrawingContext {
  private _points: { x: number; y: number }[];
  private _svgData: string;
  private _transX: number;
  private _transY: number;

  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  // TODO: currently unused
  font: string;

  constructor() {
    this.fillStyle = "black";
    this.strokeStyle = "black";
    this.lineWidth = 1;
    this.font = "12px Arial, sans-serif";
    this._points = [];
    this._svgData = "";
    this._transX = 0;
    this._transY = 0;
  }

  toSVG(): string {
    return (
      '<?xml version="1.0" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n\n<svg width="800" height="600" version="1.1" xmlns="http://www.w3.org/2000/svg">\n' +
      this._svgData +
      "</svg>\n"
    );
  }

  beginPath(): void {
    this._points = [];
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ): void {
    x += this._transX;
    y += this._transY;
    const style = `stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" fill="none"`;

    if (endAngle - startAngle === Math.PI * 2) {
      this._svgData += `\t<ellipse ${style} cx="${fixed(x, 3)}" cy="${fixed(y, 3)}" rx="${fixed(radius, 3)}" ry="${fixed(radius, 3)}"/>\n`;
    } else {
      if (counterclockwise) {
        [startAngle, endAngle] = [endAngle, startAngle];
      }

      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }

      const startX = x + radius * Math.cos(startAngle);
      const startY = y + radius * Math.sin(startAngle);
      const endX = x + radius * Math.cos(endAngle);
      const endY = y + radius * Math.sin(endAngle);
      const useGreaterThan180 = Math.abs(endAngle - startAngle) > Math.PI;
      const goInPositiveDirection = 1;

      this._svgData += `\t<path ${style} d="`;
      this._svgData += `M ${fixed(startX, 3)},${fixed(startY, 3)} `;
      this._svgData += `A ${fixed(radius, 3)},${fixed(radius, 3)} `;
      this._svgData += `0 ${+useGreaterThan180} ${+goInPositiveDirection} `;
      this._svgData += `${fixed(endX, 3)},${fixed(endY, 3)}"/>\n`;
    }
  }

  moveTo(x: number, y: number): void {
    x += this._transX;
    y += this._transY;
    this._points.push({ x, y });
  }

  lineTo(x: number, y: number): void {
    this.moveTo(x, y);
  }

  stroke(): void {
    if (this._points.length === 0) return;
    this._svgData += `\t<polygon stroke="${this.strokeStyle}" stroke-width="${this.lineWidth}" points="`;
    this._svgData += this._points.map((p) => `${fixed(p.x, 3)},${fixed(p.y, 3)}`).join(" ");
    this._svgData += '"/>\n';
  }

  fill(): void {
    if (this._points.length === 0) return;
    this._svgData += `\t<polygon fill="${this.fillStyle}" stroke-width="${this.lineWidth}" points="`;
    this._svgData += this._points.map((p) => `${fixed(p.x, 3)},${fixed(p.y, 3)}`).join(" ");
    this._svgData += '"/>\n';
  }

  measureText(text: string): TextMetrics {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to get canvas context");
    context.font = '20px "Times New Roman", serif';
    return context.measureText(text);
  }

  fillText(text: string, x: number, y: number): void {
    x += this._transX;
    y += this._transY;
    if (text.replace(" ", "").length > 0) {
      this._svgData += `\t<text x="${fixed(x, 3)}" y="${fixed(y, 3)}" font-family="Times New Roman" font-size="20">${textToXML(text)}</text>\n`;
    }
  }

  translate(x: number, y: number): void {
    this._transX = x;
    this._transY = y;
  }

  async export(): Promise<Blob> {
    return new Blob([this.toSVG()], { type: "image/svg+xml" });
  }

  save(): void {}
  restore(): void {}
  clearRect(): void {}
}

const textToXML = (text: string) => {
  text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let result = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c >= 0x20 && c <= 0x7e) {
      result += text[i];
    } else {
      result += "&#" + c + ";";
    }
  }
  return result;
};

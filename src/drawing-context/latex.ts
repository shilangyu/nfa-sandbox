import { DrawingContext } from "../components/component";
import { fixed } from "../utils";

export class LatexDrawingContext implements DrawingContext {
  private _points: { x: number; y: number }[] = [];
  private _texData: string = "";
  private _scale: number = 0.1; // to convert pixels to document space

  strokeStyle: string = "black";
  fillStyle: string = "black";
  // TODO: currently unsused
  lineWidth: number = 1;
  font: string = "";

  toLaTeX(): string {
    return (
      "\\documentclass[12pt]{article}\n" +
      "\\usepackage{tikz}\n" +
      "\n" +
      "\\begin{document}\n" +
      "\n" +
      "\\begin{center}\n" +
      "\\begin{tikzpicture}[scale=0.2]\n" +
      "\\tikzstyle{every node}+=[inner sep=0pt]\n" +
      this._texData +
      "\\end{tikzpicture}\n" +
      "\\end{center}\n" +
      "\n" +
      "\\end{document}\n"
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
    isReversed: boolean,
  ): void {
    x *= this._scale;
    y *= this._scale;
    radius *= this._scale;

    if (endAngle - startAngle === Math.PI * 2) {
      this._texData += `\\draw [${this.strokeStyle}] (${fixed(x, 3)},${fixed(-y, 3)}) circle (${fixed(radius, 3)});\n`;
    } else {
      if (isReversed) {
        [startAngle, endAngle] = [endAngle, startAngle];
      }
      if (endAngle < startAngle) {
        endAngle += Math.PI * 2;
      }
      if (Math.min(startAngle, endAngle) < -2 * Math.PI) {
        startAngle += 2 * Math.PI;
        endAngle += 2 * Math.PI;
      } else if (Math.max(startAngle, endAngle) > 2 * Math.PI) {
        startAngle -= 2 * Math.PI;
        endAngle -= 2 * Math.PI;
      }
      startAngle = -startAngle;
      endAngle = -endAngle;

      this._texData += `\\draw [${this.strokeStyle}] (${fixed(
        x + radius * Math.cos(startAngle),
        3,
      )},${fixed(-y + radius * Math.sin(startAngle), 3)}) arc (${fixed(
        (startAngle * 180) / Math.PI,
        5,
      )}:${fixed((endAngle * 180) / Math.PI, 5)}:${fixed(radius, 3)});\n`;
    }
  }

  moveTo(x: number, y: number): void {
    this.lineTo(x, y);
  }

  lineTo(x: number, y: number): void {
    x *= this._scale;
    y *= this._scale;
    this._points.push({ x, y });
  }

  stroke(): void {
    if (this._points.length === 0) return;

    this._texData += `\\draw [${this.strokeStyle}]`;
    this._points.forEach((p, i) => {
      this._texData += `${i > 0 ? " --" : ""} (${fixed(p.x, 2)},${fixed(-p.y, 2)})`;
    });
    this._texData += ";\n";
  }

  fill(): void {
    if (this._points.length === 0) return;

    this._texData += `\\fill [${this.fillStyle}]`;
    this._points.forEach((p, i) => {
      this._texData += `${i > 0 ? " --" : ""} (${fixed(p.x, 2)},${fixed(-p.y, 2)})`;
    });
    this._texData += ";\n";
  }

  measureText(text: string): TextMetrics {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to get canvas context");
    context.font = '20px "Times New Roman", serif';
    return context.measureText(text);
  }

  advancedFillText(
    text: string,
    originalText: string,
    x: number,
    y: number,
    angle: number | undefined,
  ): void {
    if (text.replace(" ", "").length > 0) {
      let nodeParams = "";
      if (angle !== undefined) {
        const width = this.measureText(text).width;
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0) {
            nodeParams = "[right]";
            x -= width / 2;
          } else {
            nodeParams = "[left]";
            x += width / 2;
          }
        } else {
          if (dy > 0) {
            nodeParams = "[below]";
            y -= 10;
          } else {
            nodeParams = "[above]";
            y += 10;
          }
        }
      }

      x *= this._scale;
      y *= this._scale;

      this._texData += `\\draw (${fixed(x, 2)},${fixed(-y, 2)}) node ${nodeParams} {$${originalText.replace(
        / /g,
        "\\mbox{ }",
      )}$};\n`;
    }
  }

  async export(): Promise<Blob> {
    return new Blob([this.toLaTeX()], { type: "application/x-tex" });
  }

  translate(): void {}
  save(): void {}
  restore(): void {}
  clearRect(): void {}
  fillText(_text: string, _x: number, _y: number, _maxWidth?: number) {}
}

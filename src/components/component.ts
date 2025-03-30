export interface Component {
  draw: (c: DrawingContext, hasFocus: boolean, isSelected: boolean) => void;
}

export interface DrawingContext {
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  arc: (
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
  ) => void;
  stroke: () => void;
  fill: () => void;
  save: () => void;
  restore: () => void;
  translate: (x: number, y: number) => void;
  clearRect: (x: number, y: number, width: number, height: number) => void;
  fillText: (text: string, x: number, y: number, maxWidth?: number) => void;
  advancedFillText?: (
    text: string,
    originalText: string,
    x: number,
    y: number,
    angle: number | undefined,
  ) => void;
  measureText: (text: string) => { width: number };
  set font(value: string);
  set strokeStyle(value: string);
  set fillStyle(value: string);
  set lineWidth(value: number);

  export(): Promise<Blob>;
}

export interface Component {
  draw: (c: CanvasRenderingContext2D, hasFocus: boolean, isSelected: boolean) => void;
}

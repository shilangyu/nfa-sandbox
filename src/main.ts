import { setupCounter } from "./counter.ts";
import "./style.css";
// The modern way (e.g. an ES6-style import for webpack, parcel)
import Konva from "konva";

var stage = new Konva.Stage({
  container: "sandbox",
  width: window.innerWidth,
  height: window.innerHeight,
});

// add canvas element
var layer = new Konva.Layer();
stage.add(layer);

// create shape
var box = new Konva.Rect({
  x: 50,
  y: 50,
  width: 100,
  height: 50,
  fill: "#00D2FF",
  stroke: "black",
  strokeWidth: 4,
  draggable: true,
});
var box2 = new Konva.Rect({
  x: 150,
  y: 50,
  width: 100,
  height: 50,
  fill: "#00D2FF",
  stroke: "black",
  strokeWidth: 4,
  draggable: true,
});
var connect = new Konva.Line({
  points: [100, 75, 150, 75],
  width: 100,
  height: 50,
  fill: "#00D2FF",
  stroke: "black",
  strokeWidth: 4,
  draggable: true,
});

layer.add(box);
layer.add(connect);
layer.add(box2);

// add cursor styling
box.on("mouseover", function () {
  document.body.style.cursor = "pointer";
});
box.on("mouseout", function () {
  document.body.style.cursor = "default";
});

setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);

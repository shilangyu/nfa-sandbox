import Konva from "konva";
import { Point } from "./geometry";
import { Id, NFA } from "./nfa";
import "./style.css";

const konvaContainer = document.querySelector<HTMLDivElement>("#sandbox")!;

// TODO: update size upon window resize
const stage = new Konva.Stage({
  container: konvaContainer,
  width: konvaContainer.offsetWidth,
  height: konvaContainer.offsetHeight,
});

// add canvas element
const layer = new Konva.Layer();
stage.add(layer);

const nextStateName = (() => {
  let stateCount = 0;
  return () => `${stateCount++}`;
})();

const initialState = Symbol(nextStateName());
type Alphabet = 0 | 1;
const nfa = new NFA(
  new Set([initialState]),
  initialState,
  new Map<symbol, Map<Alphabet, Set<Id>>>([]),
  new Set([])
);

const shapeToState = new Map<Konva.Stage | Konva.Shape, Id>();

const createStateShape = (state: Id, position?: Point) => {
  const pos = position ?? {
    // TODO: very not optimal, let user select position?
    x: Math.max(0, ...layer.children.map((e) => e.x())) + 50,
    y: Math.max(0, ...layer.children.map((e) => e.y())) + 50,
  };
  const circle = new Konva.Circle({
    ...pos,
    radius: 50,
    fill: "red",
    stroke: "black",
    strokeWidth: 4,
  });
  const text = new Konva.Text({
    x: circle.x(),
    y: circle.y(),
    text: state.description,
    fontSize: 20,
    fontFamily: "IBM Plex Sans",
    fill: "black",
  });
  const group = new Konva.Group({
    draggable: true,
  });
  group.add(circle);
  group.add(text);

  group.on("mouseover", () => {
    document.body.style.cursor = "grab";
  });
  group.on("dragstart", () => {
    document.body.style.cursor = "grabbing";
  });
  group.on("dragend", () => {
    document.body.style.cursor = "grab";
  });
  group.on("mouseout", () => {
    document.body.style.cursor = "default";
  });

  layer.add(group);
  shapeToState.set(circle, state);
};

createStateShape(initialState, { x: stage.width() / 2, y: stage.height() / 2 });

const addNewState = (position?: Point) => {
  const state = nfa.addState(nextStateName());
  createStateShape(state, position);
};

const addStateButton = document.querySelector<HTMLButtonElement>("#add-state")!;
addStateButton.addEventListener("click", () => addNewState());

stage.on("dblclick", (e) => addNewState({ x: e.evt.x, y: e.evt.y }));

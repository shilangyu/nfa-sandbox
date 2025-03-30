import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { TemporaryLink } from "./components/temporaryLink";
import { Point } from "./geometry";
import { FinalizedLink, State } from "./state";
import "./style.css";

const sandbox = document.querySelector<HTMLCanvasElement>("#sandbox")!;
const c = sandbox.getContext("2d")!;

const state = new State();

const canvasHasFocus = () => {
  return (document.activeElement ?? document.body) === document.body;
};

const onResize = () => {
  const dpr = window.devicePixelRatio;
  const rect = sandbox.getBoundingClientRect();

  // Set the "actual" size of the canvas
  sandbox.width = rect.width * dpr;
  sandbox.height = rect.height * dpr;

  // Scale the context to ensure correct drawing operations
  c.scale(dpr, dpr);

  // Set the "drawn" size of the canvas
  sandbox.style.width = `${rect.width}px`;
  sandbox.style.height = `${rect.height}px`;

  draw();
};

// TODO: does not work properly
window.addEventListener("resize", onResize);

onResize();

let movedObject: FinalizedLink | Node | undefined = undefined;
let originalClick: Point | undefined = undefined;

function draw() {
  const hasFocus = canvasHasFocus();
  c.clearRect(0, 0, sandbox.width, sandbox.height);
  state.draw(c, hasFocus);
}

sandbox.addEventListener("dblclick", function (e) {
  const mouse = { x: e.offsetX, y: e.offsetY };
  const obj = state.objectAt(mouse);

  if (obj === undefined) {
    const newNode = new Node(mouse.x, mouse.y);
    state.addNode(newNode);
    state.selectObject(newNode);
  } else if (state.selectedObject instanceof Node) {
    state.selectedObject.toggleAcceptState();
  }
  draw();
});

sandbox.addEventListener("mousedown", function (e) {
  const mouse = { x: e.offsetX, y: e.offsetY };
  const selectedObject = state.objectAt(mouse);
  state.selectObject(selectedObject);
  movedObject = undefined;
  originalClick = mouse;

  if (selectedObject !== undefined) {
    if (e.shiftKey && selectedObject instanceof Node) {
      state.setCurrentLink(new SelfLink(selectedObject, mouse));
    } else {
      movedObject = selectedObject;
      if ("setMoveStart" in selectedObject) {
        selectedObject.setMoveStart(mouse.x, mouse.y);
      }
    }
  } else if (e.shiftKey) {
    state.setCurrentLink(new TemporaryLink(mouse, mouse));
  }

  draw();

  if (canvasHasFocus()) {
    // disable drag-and-drop only if the canvas is already focused
    return false;
  } else {
    // otherwise, let the browser switch the focus away from wherever it was
    return true;
  }
});

sandbox.addEventListener("mousemove", function (e) {
  if (originalClick === undefined) return;
  const mouse = { x: e.offsetX, y: e.offsetY };

  if (state.currentLink !== undefined) {
    let targetNode = state.objectAt(mouse);
    if (!(targetNode instanceof Node)) {
      targetNode = undefined;
    }

    if (state.selectedObject === undefined) {
      if (targetNode !== undefined) {
        state.setCurrentLink(new StartLink(targetNode, State.snapToPadding, originalClick));
      } else {
        state.setCurrentLink(new TemporaryLink(originalClick, mouse));
      }
    } else {
      if (targetNode === state.selectedObject) {
        state.setCurrentLink(new SelfLink(state.selectedObject, mouse));
      }

      if (!(state.selectedObject instanceof Node)) {
        console.error("selectedObject should be a Node");
        return;
      }

      if (targetNode !== undefined) {
        state.setCurrentLink(new Link(state.selectedObject, targetNode));
      } else {
        state.setCurrentLink(
          new TemporaryLink(state.selectedObject.closestPointOnCircle(mouse.x, mouse.y), mouse),
        );
      }
    }
    draw();
  }

  if (movedObject) {
    movedObject.setAnchorPoint(mouse.x, mouse.y, State.snapToPadding);
    if (state.selectedObject instanceof Node) {
      state.snapNode(state.selectedObject);
    }
    draw();
  }
});

sandbox.addEventListener("mouseup", () => {
  movedObject = undefined;

  state.upgradeCurrentLink();
  draw();
});

document.addEventListener("keydown", (e) => {
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (e.code === "Backspace") {
    // backspace key
    if (state.selectedObject !== undefined && "text" in state.selectedObject) {
      state.selectedObject.text = state.selectedObject.text.slice(0, -1);
      draw();
    }

    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  } else if (e.code === "Delete") {
    // delete key
    if (state.selectedObject !== undefined) {
      state.removeSelectedObject();
      draw();
    }
  }
});

document.addEventListener("keydown", function (e) {
  const keyCode = e.key.length === 1 ? e.key.charCodeAt(0) : NaN;

  // don't read keystrokes when other things have focus
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (
    keyCode >= 0x20 &&
    keyCode <= 0x7e &&
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    state.selectedObject !== undefined &&
    "text" in state.selectedObject
  ) {
    state.selectedObject.text += e.key;
    draw();

    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (e.code === "Backspace") {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
});

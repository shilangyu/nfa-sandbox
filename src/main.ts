import { loadBackup, saveBackup } from "./backup";
import { DrawingContext } from "./components/component";
import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { TemporaryLink } from "./components/temporaryLink";
import { CanvasDrawingContext } from "./drawing-context/canvas";
import { LatexDrawingContext } from "./drawing-context/latex";
import { SvgDrawingContext } from "./drawing-context/svg";
import { FinalizedLink, State } from "./state";
import "./style.css";
import { Point } from "./utils";

const simulationInput = document.querySelector<HTMLInputElement>("#simulation-input")!;
const simulationStep = document.querySelector<HTMLButtonElement>("#simulation-step")!;
const simulationStateRunning = document.querySelector<HTMLDivElement>(
  "#simulation-state > .progress",
)!;
const simulationStateAccept = document.querySelector<HTMLDivElement>(
  "#simulation-state > .success",
)!;
const simulationStateReject = document.querySelector<HTMLDivElement>("#simulation-state > .error")!;
const showHelp = document.querySelector<HTMLButtonElement>("#show-help")!;
const helpDialog = document.querySelector<HTMLDialogElement>("#help-dialog")!;

const sandbox = document.querySelector<HTMLCanvasElement>("#sandbox")!;
const ctx = sandbox.getContext("2d")!;
const c = new CanvasDrawingContext(ctx);

const state = loadBackup() ?? new State();

const canvasHasFocus = () => {
  return (document.activeElement ?? document.body) === document.body;
};

const drawWith = (c: DrawingContext, time?: number) => {
  const hasFocus = canvasHasFocus();
  c.clearRect(0, 0, sandbox.width, sandbox.height);
  state.draw(c, time ?? 0, hasFocus, window.matchMedia("(prefers-color-scheme: dark)").matches);
};

window.requestAnimationFrame((zero) => {
  const draw = (timestamp: DOMHighResTimeStamp) => {
    const time = timestamp - zero;
    drawWith(c, time);

    simulationStateRunning.style.visibility = "hidden";
    simulationStateAccept.style.visibility = "hidden";
    simulationStateReject.style.visibility = "hidden";
    simulationStep.disabled = false;
    if (state.simulation !== undefined) {
      const simulationState = state.simulation.getCurrentSimulationState();
      switch (simulationState) {
        case "running":
          simulationStateRunning.style.visibility = "visible";
          break;
        case "accept":
          simulationStateAccept.style.visibility = "visible";
          simulationStep.disabled = true;
          break;
        case "reject":
          simulationStateReject.style.visibility = "visible";
          simulationStep.disabled = true;
          break;
      }
    }

    saveBackup(state);
    window.requestAnimationFrame(draw);
  };

  draw(zero);
});

const onResize = () => {
  const dpr = window.devicePixelRatio;
  const rect = sandbox.getBoundingClientRect();

  // Set the "actual" size of the canvas
  sandbox.width = rect.width * dpr;
  sandbox.height = rect.height * dpr;

  // Scale the context to ensure correct drawing operations
  ctx.scale(dpr, dpr);

  // Set the "drawn" size of the canvas
  sandbox.style.width = `${rect.width}px`;
  sandbox.style.height = `${rect.height}px`;
};

// TODO: does not work properly
window.addEventListener("resize", onResize);

onResize();

simulationInput.addEventListener("input", () => {
  state.resetSimulation();
});

simulationStep.addEventListener("click", () => {
  // TODO: this is a bad way to create letters. We did not restrict links to accept single-character strings
  const input = simulationInput.value.split("");
  state.simulateStep(input);
});

let movedObject: FinalizedLink | Node | undefined = undefined;
let originalClick: Point | undefined = undefined;

const saveWith = async (exporter: DrawingContext) => {
  state.selectObject(undefined);
  state.resetSimulation();
  drawWith(exporter);
  const blob = await exporter.export();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "export";
  a.click();
  URL.revokeObjectURL(url);
};

showHelp.addEventListener("click", () => {
  helpDialog.showModal();
});

helpDialog.addEventListener("click", (e) => {
  if (e.target === helpDialog) {
    helpDialog.close();
  }
});

document
  .querySelector("#export-png")!
  .addEventListener("click", () => saveWith(new CanvasDrawingContext(ctx)));
document
  .querySelector("#export-svg")!
  .addEventListener("click", () => saveWith(new SvgDrawingContext()));
document
  .querySelector("#export-latex")!
  .addEventListener("click", () => saveWith(new LatexDrawingContext()));

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
        state.setCurrentLink(
          new StartLink(targetNode, { point: originalClick, snapToPadding: State.snapToPadding }),
        );
      } else {
        state.setCurrentLink(new TemporaryLink(originalClick, mouse));
      }
    } else {
      if (targetNode === state.selectedObject) {
        state.setCurrentLink(new SelfLink(state.selectedObject, mouse));
      } else {
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
    }
  }

  if (movedObject) {
    movedObject.setAnchorPoint(mouse.x, mouse.y, State.snapToPadding);
    if (state.selectedObject instanceof Node) {
      state.snapNode(state.selectedObject);
    }
  }
});

sandbox.addEventListener("mouseup", () => {
  movedObject = undefined;

  state.upgradeCurrentLink();
});

document.addEventListener("keydown", (e) => {
  if (!canvasHasFocus()) {
    // don't read keystrokes when other things have focus
    return true;
  } else if (e.code === "Backspace") {
    // backspace key
    if (state.selectedObject !== undefined && "text" in state.selectedObject) {
      state.selectedObject.text = state.selectedObject.text.slice(0, -1);
    }

    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  } else if (e.code === "Delete") {
    // delete key
    if (state.selectedObject !== undefined) {
      state.removeSelectedObject();
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

    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (e.code === "Backspace") {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
});

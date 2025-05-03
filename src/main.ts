import { loadBackup, saveBackup } from "./backup";
import { DrawingContext } from "./components/component";
import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { TemporaryLink } from "./components/temporaryLink";
import { CanvasDrawingContext } from "./drawing-context/canvas";
import { FinalizedLink, State } from "./state";
import "./style.css";
import { check } from "./test";
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
const testButton = document.querySelector<HTMLButtonElement>("#test")!;

const sandbox = document.querySelector<HTMLCanvasElement>("#sandbox")!;
const ctx = sandbox.getContext("2d")!;
const c = new CanvasDrawingContext(ctx);

const defaultState = () => {
  const state = new State();
  const addLink = <T extends FinalizedLink>(link: T, edit?: (self: T) => void) => {
    edit?.(link);
    state.setCurrentLink(link);
    state.upgradeCurrentLink();
  };

  const n1 = new Node(300, 300);
  const n2 = new Node(450, 300);
  const n3 = new Node(600, 300);
  n3.toggleAcceptState();

  state.addNode(n1);
  state.addNode(n2);
  state.addNode(n3);

  addLink(new StartLink(n1, { point: { x: 250, y: 300 }, snapToPadding: State.snapToPadding }));
  addLink(new Link(n1, n2), (l) => {
    l.text = "a";
    l.lineAngleAdjust = Math.PI;
    l.parallelPart = 0.47;
    l.perpendicularPart = -29;
  });
  addLink(new Link(n1, n2), (l) => {
    l.text = "b";
    l.lineAngleAdjust = 0;
    l.parallelPart = 0.54;
    l.perpendicularPart = 29;
  });
  addLink(new SelfLink(n2, undefined), (l) => {
    l.text = "a";
    l.anchorAngle = -1.45;
  });
  addLink(new Link(n2, n3), (l) => {
    l.text = "";
    l.lineAngleAdjust = 0;
    l.parallelPart = 0.5;
    l.perpendicularPart = 0;
  });

  state.selectObject(undefined);
  return state;
};

const state = loadBackup() ?? defaultState();

const canvasHasFocus = () => {
  return (document.activeElement ?? document.body) === document.body;
};

const drawWith = (c: DrawingContext, time?: number) => {
  const hasFocus = canvasHasFocus();
  c.clearRect(0, 0, sandbox.width, sandbox.height);
  state.draw(c, time ?? 0, hasFocus, false);
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

onResize();

simulationInput.addEventListener("input", () => {
  state.resetSimulation();
});

simulationStep.addEventListener("click", () => {
  const input = simulationInput.value.split("");
  state.simulateStep(input);
});

testButton.addEventListener("click", () => {
  const result = check(state);

  if (result === undefined) {
    alert("Tout est correct !");
  } else if ("shouldPass" in result) {
    alert(
      `Le mot ${result.shouldPass} est dans le langage mais n'est pas accepté par votre automate.`,
    );
  } else {
    alert(`Le mot ${result.shouldFail} n'est dans le langage mais est accepté par votre automate.`);
  }
});

let movedObject: FinalizedLink | Node | undefined = undefined;
let originalClick: Point | undefined = undefined;

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
    state.selectedObject.text = e.key;

    // don't let keys do their actions (like space scrolls down the page)
    return false;
  } else if (e.code === "Backspace") {
    // backspace is a shortcut for the back button, but do NOT want to change pages
    return false;
  }
});

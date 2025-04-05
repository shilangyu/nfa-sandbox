import { DrawingContext } from "./components/component";
import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { TemporaryLink } from "./components/temporaryLink";
import { Simulation } from "./simulation";
import { Point } from "./utils";

export type FinalizedLink = Link | SelfLink | StartLink;
type WorkLink = Link | SelfLink | StartLink | TemporaryLink;

export class State {
  nodes: Node[] = [];
  links: FinalizedLink[] = [];
  selectedObject: Node | FinalizedLink | undefined = undefined;
  currentLink: WorkLink | undefined = undefined;

  simulation: Simulation | undefined = undefined;

  static snapToPadding = 6;

  objectAt = (point: Point) => {
    const hitTargetPadding = 6;

    for (const node of this.nodes) {
      if (node.containsPoint(point.x, point.y)) {
        return node;
      }
    }
    for (const link of this.links) {
      if (link.containsPoint(point.x, point.y, hitTargetPadding)) {
        return link;
      }
    }

    return undefined;
  };

  selectObject = (object: typeof this.selectedObject) => {
    this.selectedObject = object;
  };

  addNode = (node: Node) => {
    this.nodes.push(node);
    this.resetSimulation();
  };

  setCurrentLink = (link: WorkLink) => {
    this.currentLink = link;
  };

  upgradeCurrentLink = () => {
    if (this.currentLink !== undefined && !(this.currentLink instanceof TemporaryLink)) {
      if (this.currentLink instanceof StartLink) {
        // we want only a single start link at any given time
        this.links = this.links.filter((link) => !(link instanceof StartLink));
      }
      this.links.push(this.currentLink);
      this.selectObject(this.currentLink);
      this.resetSimulation();
    }
    this.currentLink = undefined;
  };

  snapNode = (that: Node) => {
    for (const node of this.nodes) {
      if (node === that) continue;

      if (Math.abs(that.x - node.x) < State.snapToPadding) {
        that.x = node.x;
      }

      if (Math.abs(that.y - node.y) < State.snapToPadding) {
        that.y = node.y;
      }
    }
  };

  removeSelectedObject = () => {
    if (this.selectedObject === undefined) return;

    if (this.selectedObject instanceof Node) {
      const node = this.selectedObject;
      this.nodes = this.nodes.filter((n) => n !== node);

      this.links = this.links.filter((link) => {
        if (link instanceof StartLink) {
          return link.node !== node;
        } else if (link instanceof SelfLink) {
          return link.node !== node;
        } else {
          return link.nodeA !== node && link.nodeB !== node;
        }
      });
    } else {
      this.links = this.links.filter((link) => link !== this.selectedObject);
    }

    this.selectedObject = undefined;
    this.resetSimulation();
  };

  draw = (c: DrawingContext, time: number, hasFocus: boolean, darkMode: boolean) => {
    c.save();
    c.translate(0.5, 0.5);

    const strokeColor = darkMode ? "white" : "black";

    for (const node of this.nodes) {
      c.save();
      const isSelected = node === this.selectedObject;
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = isSelected ? "blue" : strokeColor;
      node.draw(c, hasFocus, isSelected);
      c.restore();
    }
    for (const link of this.links) {
      c.save();
      const isSelected = link === this.selectedObject;
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = isSelected ? "blue" : strokeColor;
      link.draw(c, hasFocus, isSelected);
      c.restore();
    }
    if (this.currentLink !== undefined) {
      c.save();
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = strokeColor;
      this.currentLink.draw(c, hasFocus, false);
      c.restore();
    }

    if (this.simulation !== undefined) {
      c.save();
      c.fillStyle = c.strokeStyle = strokeColor;
      this.simulation.draw(c, time);
      c.restore();
    }

    c.restore();
  };

  resetSimulation = () => {
    this.simulation = undefined;
  };

  simulateStep = (input: string[]) => {
    if (this.simulation === undefined) {
      this.simulation = new Simulation(this, input);
    } else {
      this.simulation.simulateStep();
    }
  };
}

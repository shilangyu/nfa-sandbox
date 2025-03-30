import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { TemporaryLink } from "./components/temporaryLink";
import { Point } from "./geometry";

type FinalizedLink = Link | SelfLink | StartLink;
type WorkLink = Link | SelfLink | StartLink | TemporaryLink;

export class State {
  nodes: Node[] = [];
  links: FinalizedLink[] = [];
  selectedObject: Node | FinalizedLink | undefined = undefined;
  currentLink: WorkLink | undefined = undefined;

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
  };

  setCurrentLink = (link: WorkLink) => {
    this.currentLink = link;
  };

  upgradeCurrentLink = () => {
    if (this.currentLink !== undefined && !(this.currentLink instanceof TemporaryLink)) {
      this.links.push(this.currentLink);
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
  };

  draw = (c: CanvasRenderingContext2D, hasFocus: boolean) => {
    c.save();
    c.translate(0.5, 0.5);

    for (const node of this.nodes) {
      const isSelected = node == this.selectedObject;
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = isSelected ? "blue" : "black";
      node.draw(c, hasFocus, isSelected);
    }
    for (const link of this.links) {
      const isSelected = link == this.selectedObject;
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = isSelected ? "blue" : "black";
      link.draw(c, hasFocus, isSelected);
    }
    if (this.currentLink !== undefined) {
      c.lineWidth = 1;
      c.fillStyle = c.strokeStyle = "black";
      this.currentLink.draw(c, hasFocus, false);
    }

    c.restore();
  };
}

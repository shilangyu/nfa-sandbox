import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { FinalizedLink, State } from "./state";

type Backup = {
  nodes: {
    x: number;
    y: number;
    text: string;
    isAcceptState: boolean;
  }[];
  links: (
    | {
        type: "SelfLink";
        node: number;
        anchorAngle: number;
        text: string;
      }
    | {
        type: "StartLink";
        node: number;
        deltaX: number;
        deltaY: number;
      }
    | {
        type: "Link";
        nodeA: number;
        nodeB: number;
        lineAngleAdjust: number;
        parallelPart: number;
        perpendicularPart: number;
        text: string;
      }
  )[];
};

export const createBackup = (state: State) => {
  const backup: Backup = {
    nodes: [],
    links: [],
  };

  for (const node of state.nodes) {
    backup.nodes.push({
      x: node.x,
      y: node.y,
      text: node.text,
      isAcceptState: node.isAcceptState,
    });
  }

  for (const link of state.links) {
    if (link instanceof SelfLink) {
      backup.links.push({
        type: "SelfLink",
        node: state.nodes.indexOf(link.node),
        text: link.text,
        anchorAngle: link.anchorAngle,
      });
    } else if (link instanceof StartLink) {
      backup.links.push({
        type: "StartLink",
        node: state.nodes.indexOf(link.node),
        deltaX: link.deltaX,
        deltaY: link.deltaY,
      });
    } else {
      link satisfies Link;

      backup.links.push({
        type: "Link",
        nodeA: state.nodes.indexOf(link.nodeA),
        nodeB: state.nodes.indexOf(link.nodeB),
        text: link.text,
        lineAngleAdjust: link.lineAngleAdjust,
        parallelPart: link.parallelPart,
        perpendicularPart: link.perpendicularPart,
      });
    }
  }

  return backup;
};

const localStorageKey = "fsm:v3";

export const saveBackup = (state: State) => {
  localStorage[localStorageKey] = JSON.stringify(createBackup(state));
};

export const loadBackup = (): State | undefined => {
  try {
    const state = new State();
    const backup = JSON.parse(localStorage[localStorageKey]) as Backup;

    for (const backupNode of backup.nodes) {
      const node = new Node(backupNode.x, backupNode.y);
      node.isAcceptState = backupNode.isAcceptState;
      node.text = backupNode.text;
      state.nodes.push(node);
    }

    for (const backupLink of backup.links) {
      let link: FinalizedLink | undefined = undefined;
      switch (backupLink.type) {
        case "SelfLink":
          link = new SelfLink(state.nodes[backupLink.node], undefined);
          link.anchorAngle = backupLink.anchorAngle;
          link.text = backupLink.text;
          break;
        case "StartLink":
          link = new StartLink(state.nodes[backupLink.node], undefined);
          link.deltaX = backupLink.deltaX;
          link.deltaY = backupLink.deltaY;
          break;
        case "Link":
          link = new Link(state.nodes[backupLink.nodeA], state.nodes[backupLink.nodeB]);
          link.parallelPart = backupLink.parallelPart;
          link.perpendicularPart = backupLink.perpendicularPart;
          link.text = backupLink.text;
          link.lineAngleAdjust = backupLink.lineAngleAdjust;
          break;
      }

      state.links.push(link);
    }

    return state;
  } catch (e) {
    localStorage.removeItem(localStorageKey);
    return undefined;
  }
};

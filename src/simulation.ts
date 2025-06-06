import { DrawingContext } from "./components/component";
import { drawText } from "./components/drawing";
import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { FinalizedLink, State } from "./state";
import { easeInOutQuad, lineTween, shallowArrayEquals } from "./utils";

export type SimulationFinalState = "accept" | "reject";
export type SimulationState = "running" | SimulationFinalState;

const epsilon: unique symbol = Symbol("ε");

class CurrentState {
  constructor(
    // the current held input
    public input: string[],
    // the link that was used to get here. The end node is the current state
    public link: FinalizedLink,
    public startNodeIndex: number,
    public endNodeIndex: number,
  ) {}
}

export class Simulation {
  private states: CurrentState[];
  #stepTime: number | undefined = undefined;

  constructor(
    private state: State,
    input: string[],
  ) {
    this.states = state.links
      .filter((link) => link instanceof StartLink)
      .map((link) => new CurrentState(input, link, 0, 0));
  }

  #findTransition = (node: Node, input: string | typeof epsilon): FinalizedLink[] => {
    const letter = input === epsilon ? "" : input;

    return this.state.links
      .map((link): FinalizedLink | undefined => {
        if (link instanceof StartLink) return undefined;
        else if (link instanceof SelfLink) {
          if (link.node === node && link.text === letter) return link;
          else return undefined;
        } else if (link instanceof Link) {
          if (link.nodeA === node && link.text === letter) return link;
          else return undefined;
        } else link satisfies never;
      })
      .filter((link) => link !== undefined);
  };

  #deduplicatedStates = (states: CurrentState[]) => {
    const deduplicatedStates: CurrentState[] = [];

    // a state is duplicated if the end node and input are the same
    // these would lead to the same transitions

    for (const state of states) {
      const existing = deduplicatedStates.some(
        (s) =>
          shallowArrayEquals(state.input, s.input) && s.link.endNode() === state.link.endNode(),
      );
      if (!existing) {
        deduplicatedStates.push(state);
      }
    }

    return deduplicatedStates;
  };

  simulateStep = () => {
    this.#stepTime = undefined;

    const newStates: CurrentState[] = [];

    // end nodes get the same index if they have the same input
    const endNodeIndices = new Map<Node, string[][]>();
    const getEndNodeIndex = (link: FinalizedLink, input: string[]) => {
      const inputs = endNodeIndices.get(link.endNode()) ?? [];
      const index = inputs.findIndex((i) => shallowArrayEquals(i, input));
      if (index === -1) {
        inputs.push(input);
        endNodeIndices.set(link.endNode(), inputs);
        return inputs.length - 1;
      } else {
        return index;
      }
    };

    for (const state of this.#deduplicatedStates(this.states)) {
      // are there any epsilon transitions?
      const epsilonTransitions = this.#findTransition(state.link.endNode(), epsilon);
      // we can get there without consuming input
      for (const link of epsilonTransitions) {
        newStates.push(
          new CurrentState(
            state.input,
            link,
            state.endNodeIndex,
            getEndNodeIndex(link, state.input),
          ),
        );
      }

      // are there any consuming transitions we can take?
      if (state.input.length === 0) continue;

      const [char, rest] = [state.input[0], state.input.slice(1)];

      const charTransitions = this.#findTransition(state.link.endNode(), char);
      for (const link of charTransitions) {
        newStates.push(
          new CurrentState(rest, link, state.endNodeIndex, getEndNodeIndex(link, rest)),
        );
      }
    }

    this.states = newStates;
  };

  getCurrentSimulationState = (): SimulationState => {
    // a state is accepting if we are in an accepting state and there is no more input
    if (
      this.states.some((state) => state.link.endNode().isAcceptState && state.input.length === 0)
    ) {
      return "accept";
    }

    // if there are still states to explore, we are still running
    return this.states.length === 0 ? "reject" : "running";
  };

  draw = (c: DrawingContext, time: number) => {
    if (this.#stepTime === undefined) {
      this.#stepTime = time;
    }
    const animationTimeMs = 3000;
    const positioningFrac = 0.2;
    const startConsumingTokenFrac = 0.3;
    console.assert(positioningFrac * 2 < 1, "positioningFrac must be less than 0.5");
    const animationProgress = easeInOutQuad(
      Math.max(0, Math.min(1, (time - this.#stepTime) / animationTimeMs)),
    );
    const fontSize = 30;
    const overlapOffset = fontSize * 0.75;
    const familyFace = "IBM Plex Sans";

    // assign indexes for states taking the same link
    const linkCounters = new Map<FinalizedLink, number>();
    for (const state of this.states) {
      const { input: inputRaw, link } = state;
      const startNode = link.startNode();
      const endNode = link.endNode();

      // get indices
      const linkCounter = linkCounters.get(link) ?? 0;
      linkCounters.set(link, linkCounter + 1);
      const startNodeOffset = (0.5 + state.startNodeIndex) * overlapOffset;
      const endNodeOffset = (0.5 + state.endNodeIndex) * overlapOffset;
      const linkOffset = (1 + linkCounter) * overlapOffset;

      const input = inputRaw.join("") || "ε";
      const token = link.token() ?? "";
      c.font = `${fontSize}px "${familyFace}"`;
      const tokenWidth = c.measureText(token).width;
      const inputWidth = c.measureText(input).width;

      const { tokenPoint, inputPoint } = (() => {
        if (animationProgress < positioningFrac && startNode !== undefined) {
          // go from top of the node to the start of the arrow
          const progress = animationProgress / positioningFrac;
          const point = lineTween(
            { x: startNode.x, y: startNode.y - (Node.radius + startNodeOffset) },
            link.tween(0, linkOffset),
            progress,
          );

          return {
            tokenPoint: {
              x: point.x - inputWidth / 2,
              y: point.y,
              angle: undefined,
            },
            inputPoint: {
              x: point.x + tokenWidth / 2,
              y: point.y,
            },
          };
        } else if (animationProgress > 1 - positioningFrac) {
          // go from the end of the arrow to the top of the node
          const progress = (animationProgress - (1 - positioningFrac)) / positioningFrac;
          const point = lineTween(
            link.tween(1, linkOffset),
            { x: endNode.x, y: endNode.y - (Node.radius + endNodeOffset) },
            progress,
          );

          return {
            tokenPoint: undefined,
            inputPoint: point,
          };
        } else {
          // path on the link
          const progress =
            startNode === undefined
              ? animationProgress / (1 - positioningFrac)
              : (animationProgress - positioningFrac) / (1 - 2 * positioningFrac);

          const point = link.tween(progress, linkOffset);
          const tokenPosition = link.tokenPosition();

          if (progress < startConsumingTokenFrac || tokenPosition === undefined) {
            // the token still follows the input
            return {
              tokenPoint: {
                x: point.x - inputWidth / 2,
                y: point.y,
                angle: undefined,
              },
              inputPoint: {
                x: point.x + tokenWidth / 2,
                y: point.y,
              },
            };
          } else {
            const tokenProgress =
              (progress - startConsumingTokenFrac) / (1 - startConsumingTokenFrac);
            const linkStartTokenPosition = link.tween(startConsumingTokenFrac, linkOffset);

            // the token merges with the link
            const tokenPoint = lineTween(
              { x: linkStartTokenPosition.x - inputWidth / 2, y: linkStartTokenPosition.y },
              tokenPosition,
              tokenProgress,
            );

            return {
              tokenPoint: { ...tokenPoint, angle: tokenProgress * tokenPosition.angle },
              inputPoint: {
                x: point.x + (1 - tokenProgress) * (tokenWidth / 2),
                y: point.y,
              },
            };
          }
        }
      })();

      if (tokenPoint) {
        c.save();
        c.fillStyle = "green";
        drawText(
          c,
          token,
          tokenPoint.x,
          tokenPoint.y,
          tokenPoint.angle,
          false,
          false,
          fontSize,
          familyFace,
        );
        c.restore();
      }
      drawText(c, input, inputPoint.x, inputPoint.y, undefined, false, false, fontSize, familyFace);
    }
  };
}

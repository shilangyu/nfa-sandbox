import { DrawingContext } from "./components/component";
import { drawText } from "./components/drawing";
import { Link } from "./components/link";
import { Node } from "./components/node";
import { SelfLink } from "./components/selfLink";
import { StartLink } from "./components/startLink";
import { FinalizedLink, State } from "./state";
import { shallowArrayEquals } from "./utils";

export type SimulationFinalState = "accept" | "reject";
export type SimulationState = "running" | SimulationFinalState;

const epsilon: unique symbol = Symbol("ε");

export class Simulation {
  private states: [Node, string[], FinalizedLink][];
  #stepTime: number | undefined = undefined;

  constructor(
    private state: State,
    input: string[],
  ) {
    this.states = state.links
      .filter((link) => link instanceof StartLink)
      .map((link) => [link.node, input, link]);
  }

  #findTransition = (state: Node, input: string | typeof epsilon): [Node, FinalizedLink][] => {
    const letter = input === epsilon ? "" : input;

    return this.state.links
      .map((link): [Node, FinalizedLink] | undefined => {
        if (link instanceof StartLink) return undefined;
        else if (link instanceof SelfLink) {
          if (link.node === state && link.text === letter) return [link.node, link];
          else return undefined;
        } else if (link instanceof Link) {
          if (link.nodeA === state && link.text === letter) return [link.nodeB, link];
          else return undefined;
        } else link satisfies never;
      })
      .filter((link) => link !== undefined);
  };

  #isAccepting = (state: Node) => {
    return this.state.nodes.some((node) => node.isAcceptState && node === state);
  };

  #deduplicateStates = (states: [Node, string[], FinalizedLink][]) => {
    const deduplicatedStates: [Node, string[], FinalizedLink][] = [];

    for (const [state, input, link] of states) {
      const existing = deduplicatedStates.some(
        ([s, i, l]) => s === state && shallowArrayEquals(input, i) && l === link,
      );
      if (!existing) {
        deduplicatedStates.push([state, input, link]);
      }
    }

    return deduplicatedStates;
  };

  simulateStep = () => {
    this.#stepTime = undefined;

    const newStates: typeof this.states = [];

    for (const [state, input] of this.states) {
      // are there any epsilon transitions?
      const epsilonTransitions = this.#findTransition(state, epsilon);
      // we can get there without consuming input
      for (const [to, link] of epsilonTransitions) {
        newStates.push([to, input, link]);
      }

      // are there any consuming transitions we can take?
      if (input.length === 0) continue;

      const [char, rest] = [input[0], input.slice(1)];

      const charTransitions = this.#findTransition(state, char);
      for (const [to, link] of charTransitions) {
        newStates.push([to, rest, link]);
      }
    }

    this.states = this.#deduplicateStates(newStates);
  };

  getCurrentSimulationState = (): SimulationState => {
    // a state is accepting if we are in an accepting state and there is no more input
    if (this.states.some(([state, input]) => this.#isAccepting(state) && input.length === 0)) {
      return "accept";
    }

    // if there are still states to explore, we are still running
    return this.states.length === 0 ? "reject" : "running";
  };

  simulateTillEnd = (): SimulationFinalState => {
    let state = this.getCurrentSimulationState();
    while (state === "running") {
      // TODO: automaton can have an infinite loop. Termination is decidable and computable for NFAs
      this.simulateStep();
      state = this.getCurrentSimulationState();
    }

    return state;
  };

  draw = (c: DrawingContext, time: number) => {
    if (this.#stepTime === undefined) {
      this.#stepTime = time;
    }
    const animationTimeMs = 300;
    const animationProgress = Math.max(0, Math.min(1, (time - this.#stepTime) / animationTimeMs));
    // group by nodes
    const groupedStates = new Map<Node, [FinalizedLink, string[]][]>();

    for (const [node, input, link] of this.states) {
      groupedStates.set(node, [...(groupedStates.get(node) ?? []), [link, input]]);
    }

    for (const [, inputs] of groupedStates) {
      for (const [link, input] of inputs) {
        const { x, y } = link.tween(animationProgress);
        // TODO: show it better and more visible that it is the simulation
        drawText(c, input.join(""), x, y, undefined, false, false);
      }
    }
  };
}

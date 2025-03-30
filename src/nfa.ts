import { isSubsetOf } from "./utils";

export type Id = symbol;
export const epsilon: unique symbol = Symbol("ε");

export type TransitionInput<Alphabet> = Alphabet | typeof epsilon;

export class NFA<Alphabet> {
  #states: Set<Id>;
  #transitions: Map<Id, Map<TransitionInput<Alphabet>, Set<Id>>>;
  #acceptingStates: Set<Id>;

  constructor(public readonly initialState: Id) {
    this.#states = new Set([initialState]);
    this.#transitions = new Map();
    this.#acceptingStates = new Set();
    this.#checkValid();
  }

  #checkValid = () => {
    // the initial state exists
    console.assert(this.#states.has(this.initialState));

    // check all transitions are valid
    for (const [from, transitions] of this.#transitions) {
      // transition state exists
      console.assert(this.#states.has(from));
      for (const [_, to] of transitions) {
        // to states exist
        console.assert(isSubsetOf(to, this.#states));
      }
    }

    // accepting states exist
    console.assert(isSubsetOf(this.#acceptingStates, this.#states));
  };

  isAccepting = (state: Id) => this.#acceptingStates.has(state);

  findTransition = (state: Id, input: TransitionInput<Alphabet>) =>
    this.#transitions.get(state)?.get(input) ?? new Set();

  addState = (name: string) => {
    const state = Symbol(name);
    this.#states.add(state);
    this.#checkValid();

    return state;
  };

  removeState = (state: Id) => {
    this.#states.delete(state);
    this.#transitions.delete(state);
    this.#checkValid();
  };

  makeAccepting = (state: Id) => {
    this.#acceptingStates.add(state);
    this.#checkValid();
  };

  makeNonAccepting = (state: Id) => {
    this.#acceptingStates.delete(state);
    this.#checkValid();
  };
}

export type SimulationFinalState = "accept" | "reject";
export type SimulationState = "running" | SimulationFinalState;

export class Simulation<Alphabet> {
  private states: [Id, Alphabet[]][];

  constructor(
    private nfa: NFA<Alphabet>,
    input: Alphabet[],
  ) {
    this.states = [[nfa.initialState, input]];
  }

  simulateStep = () => {
    const newStates: typeof this.states = [];

    for (const [state, input] of this.states) {
      // are there any epsilon transitions?
      const epsilonTransitions = this.nfa.findTransition(state, epsilon);
      // we can get there without consuming input
      for (const to of epsilonTransitions) {
        newStates.push([to, input]);
      }

      // are there any consuming transitions we can take?
      if (input.length === 0) continue;

      const [char, rest] = [input[0], input.slice(1)];

      const charTransitions = this.nfa.findTransition(state, char);
      for (const to of charTransitions) {
        newStates.push([to, rest]);
      }
    }

    this.states = newStates;
  };

  getCurrentSimulationState = (): SimulationState => {
    // a state is accepting if we are in an accepting state and there is no more input
    if (this.states.some(([state, input]) => this.nfa.isAccepting(state) && input.length === 0)) {
      return "accept";
    }

    // if there are still states to explore, we are still running
    return this.states.length === 0 ? "reject" : "running";
  };

  simulateTillEnd = (): SimulationFinalState => {
    let state = this.getCurrentSimulationState();
    while (state === "running") {
      this.simulateStep();
      state = this.getCurrentSimulationState();
    }

    return state;
  };
}

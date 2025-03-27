import { isSubsetOf } from "./utils";

export type Id = symbol;
export const epsilon: unique symbol = Symbol("ε");

export class NFA<Alphabet> {
  constructor(
    private states: Set<Id>,
    public readonly initialState: Id,
    private transitions: Map<Id, Map<Alphabet | typeof epsilon, Set<Id>>>,
    private acceptingStates: Set<Id>
  ) {
    this.#checkValid();
  }

  #checkValid = () => {
    // the initial state exists
    console.assert(this.states.has(this.initialState));

    // check all transitions are valid
    for (const [from, transitions] of this.transitions) {
      // transition state exists
      console.assert(this.states.has(from));
      for (const [_, to] of transitions) {
        // to states exist
        console.assert(isSubsetOf(to, this.states));
      }
    }

    // accepting states exist
    console.assert(isSubsetOf(this.acceptingStates, this.states));
  };

  isAccepting = (state: Id) => this.acceptingStates.has(state);

  findTransition = (state: Id, input: Alphabet | typeof epsilon) =>
    this.transitions.get(state)?.get(input) ?? new Set();

  addState = (name: string) => {
    const state = Symbol(name);
    this.states.add(state);
    this.#checkValid();

    return state;
  };

  removeState = (state: Id) => {
    this.states.delete(state);
    this.transitions.delete(state);
    this.#checkValid();
  };

  makeAccepting = (state: Id) => {
    this.acceptingStates.add(state);
    this.#checkValid();
  };

  makeNonAccepting = (state: Id) => {
    this.acceptingStates.delete(state);
    this.#checkValid();
  };
}

export type SimulationState = "running" | "accept" | "reject";

export class Simulation<Alphabet> {
  private states: [Id, Alphabet[]][];

  constructor(
    private nfa: NFA<Alphabet>,
    input: Alphabet[]
  ) {
    this.states = [[nfa.initialState, input]];
  }

  simulateStep = () => {
    const newState: typeof this.states = [];

    for (const [state, input] of this.states) {
      // are there any epsilon transitions?
      const epsilonTransitions = this.nfa.findTransition(state, epsilon);
      // we can get there without consuming input
      for (const to of epsilonTransitions) {
        newState.push([to, input]);
      }

      // are there any consuming transitions we can take?
      if (input.length === 0) continue;

      const [char, rest] = [input[0], input.slice(1)];

      const charTransitions = this.nfa.findTransition(state, char);
      for (const to of charTransitions) {
        newState.push([to, rest]);
      }
    }

    this.states = newState;
  };

  getCurrentSimulationState: () => SimulationState = () => {
    // a state is accepting if we are in an accepting state and there is no more input
    if (
      this.states.some(
        ([state, input]) => this.nfa.isAccepting(state) && input.length === 0
      )
    ) {
      return "accept";
    }

    // if there are still states to explore, we are still running
    return this.states.length === 0 ? "reject" : "running";
  };
}

import { isSubsetOf } from "./utils";

export type Id = symbol;

export class NFA<Alphabet> {
  constructor(
    private states: Set<Id>,
    private initialState: Id,
    private transitions: Map<Id, Map<Alphabet, Set<Id>>>,
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

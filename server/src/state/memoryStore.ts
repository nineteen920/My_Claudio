import type { RadioState } from '../../../shared/types';
import { initialState, type StateStore } from './stateStore';

export function createMemoryStore(seed: RadioState = initialState): StateStore {
  let state: RadioState = structuredClone(seed);

  return {
    async readState() {
      return structuredClone(state);
    },
    async writeState(nextState) {
      state = structuredClone(nextState);
    },
    async updateState(updater) {
      state = updater(structuredClone(state));
      return structuredClone(state);
    }
  };
}

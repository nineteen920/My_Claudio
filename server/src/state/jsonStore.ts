import fs from 'node:fs/promises';
import path from 'node:path';
import type { RadioState } from '../../../shared/types';
import { initialState, type StateStore } from './stateStore';

export function createJsonStore(dataDir: string): StateStore {
  const filePath = path.join(dataDir, 'state', 'radio-state.json');

  async function ensureStateFile() {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(initialState, null, 2), 'utf8');
    }
  }

  return {
    async readState() {
      await ensureStateFile();
      return JSON.parse(await fs.readFile(filePath, 'utf8')) as RadioState;
    },
    async writeState(state) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2), 'utf8');
    },
    async updateState(updater) {
      const current = await this.readState();
      const next = updater(current);
      await this.writeState(next);
      return next;
    }
  };
}

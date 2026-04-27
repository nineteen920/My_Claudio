import type { FeedbackInput, RadioState } from '../../shared/types';

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `请求失败：${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function getNow(): Promise<RadioState> {
  return readJson<RadioState>(await fetch('/api/now'));
}

export async function getNext(): Promise<RadioState> {
  return readJson<RadioState>(await fetch('/api/next'));
}

export async function sendChat(message: string): Promise<RadioState> {
  return readJson<RadioState>(
    await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    })
  );
}

export async function sendFeedback(input: FeedbackInput): Promise<RadioState> {
  return readJson<RadioState>(
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    })
  );
}

export async function setPlaybackStatus(status: RadioState['status']): Promise<RadioState> {
  return readJson<RadioState>(
    await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
  );
}

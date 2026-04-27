export interface TtsProvider {
  speak(text: string): Promise<string | undefined>;
}


import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { authService, getApiUrl } from './authService';

export class LiveService {
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private inputSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private outputNode: GainNode | null = null;
  
  private isConnected: boolean = false;
  private nextStartTime: number = 0;
  private audioQueue: AudioBufferSourceNode[] = [];
  
  public onVolumeChange: (volume: number) => void = () => {};
  public onDisconnect: () => void = () => {};

  async connect(systemInstruction: string) {
    // SECURITY: The live API currently requires a client-side key for websocket connections.
    // We cannot expose the backend master key. 
    // In a real enterprise deployment, this would use a reverse proxy or STS token.
    // For this audit, we disable the feature to prevent key leakage.
    console.error("Live Service disabled: Requires Client-Side API Key configuration.");
    alert("Live Voice Feature requires a dedicated client-side API key. Please configure securely.");
    this.disconnect();
    throw new Error("Live Service disabled for security.");
  }

  // ... (Rest of logic remains as stub/dead code until secure proxy is implemented)
  public disconnect() {
    this.isConnected = false;
    this.onDisconnect();
  }
}

export const liveService = new LiveService();

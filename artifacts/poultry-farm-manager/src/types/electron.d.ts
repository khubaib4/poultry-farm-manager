declare global {
  interface Window {
    api: {
      platform: NodeJS.Platform;
      send: (channel: string, data?: unknown) => void;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

export {};

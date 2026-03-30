import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  platform: process.platform,
  send: (channel: string, data?: unknown) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

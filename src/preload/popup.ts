import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('popupApi', {
  save: (message: string) => ipcRenderer.send('popup:save', message),
  cancel: () => ipcRenderer.send('popup:cancel')
})

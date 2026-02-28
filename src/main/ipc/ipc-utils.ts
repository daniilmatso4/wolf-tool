import { ipcMain, IpcMainInvokeEvent } from 'electron'

export function safeHandle(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: any[]) => any
): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args)
    } catch (err) {
      const message = (err as Error).message || 'Unknown error'
      console.error(`[IPC] ${channel} error:`, message)
      throw new Error(message)
    }
  })
}

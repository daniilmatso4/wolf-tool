import { ElectronAPI } from '.'

declare global {
  interface Window {
    api: ElectronAPI
  }
}

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  onCloseRequested: (callback: () => void) => ipcRenderer.on('request-backup-before-close', callback),
  closeAfterBackup: () => ipcRenderer.send('close-after-backup'),
  saveBackupFile: (data: string, defaultName: string) => ipcRenderer.invoke('save-backup-file', data, defaultName),
  selectBackupDir: () => ipcRenderer.invoke('select-backup-dir'),
  autoBackup: (data: string, fileName: string) => ipcRenderer.invoke('auto-backup', data, fileName),
  checkBackupDir: () => ipcRenderer.invoke('check-backup-dir'),
  setBackupDir: (dirPath: string) => ipcRenderer.invoke('set-backup-dir', dirPath),
  getBackupConfig: () => ipcRenderer.invoke('get-backup-config'),
  setAutoBackupEnabled: (enabled: boolean) => ipcRenderer.invoke('set-auto-backup-enabled', enabled),
  setAutoBackupInterval: (interval: number) => ipcRenderer.invoke('set-auto-backup-interval', interval),
});

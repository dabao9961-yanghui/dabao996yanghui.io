// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("electron", {
  platform: process.platform,
  onCloseRequested: (callback) => import_electron.ipcRenderer.on("request-backup-before-close", callback),
  closeAfterBackup: () => import_electron.ipcRenderer.send("close-after-backup"),
  saveBackupFile: (data, defaultName) => import_electron.ipcRenderer.invoke("save-backup-file", data, defaultName),
  selectBackupDir: () => import_electron.ipcRenderer.invoke("select-backup-dir"),
  autoBackup: (data, fileName) => import_electron.ipcRenderer.invoke("auto-backup", data, fileName),
  checkBackupDir: () => import_electron.ipcRenderer.invoke("check-backup-dir"),
  setBackupDir: (dirPath) => import_electron.ipcRenderer.invoke("set-backup-dir", dirPath),
  getBackupConfig: () => import_electron.ipcRenderer.invoke("get-backup-config"),
  setAutoBackupEnabled: (enabled) => import_electron.ipcRenderer.invoke("set-auto-backup-enabled", enabled),
  setAutoBackupInterval: (interval) => import_electron.ipcRenderer.invoke("set-auto-backup-interval", interval)
});

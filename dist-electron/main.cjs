var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// electron/main.ts
var import_electron = require("electron");
var fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var mainWindow = null;
var CONFIG_FILE_NAME = "backup-config.json";
function getConfigPath() {
  const userDataPath = import_electron.app.getPath("userData");
  return import_path.default.join(userDataPath, CONFIG_FILE_NAME);
}
function loadConfig() {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to load backup config:", err);
  }
  return {
    backupDir: null,
    autoBackupEnabled: false,
    autoBackupInterval: 30,
    lastBackupTime: null
  };
}
function saveConfig(config) {
  const configPath = getConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save backup config:", err);
  }
}
var backupConfig = loadConfig();
async function createWindow() {
  mainWindow = new import_electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: "\u5DE5\u53CB\u8BB0 - \u8BB0\u5DE5\u5929\u501F\u652F\u7BA1\u7406",
    autoHideMenuBar: true,
    webPreferences: {
      preload: import_path.default.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.setMenuBarVisibility(false);
  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(import_path.default.join(__dirname, "../dist/index.html"));
  }
  mainWindow.webContents.setWindowOpenHandler((details) => {
    import_electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  mainWindow.on("close", (e) => {
    if (mainWindow) {
      e.preventDefault();
      mainWindow.webContents.send("request-backup-before-close");
    }
  });
}
import_electron.ipcMain.handle("select-backup-dir", async () => {
  if (!mainWindow) return { success: false, cancelled: true };
  const result = await import_electron.dialog.showOpenDialog(mainWindow, {
    title: "\u9009\u62E9\u5907\u4EFD\u76EE\u5F55",
    properties: ["openDirectory", "createDirectory"]
  });
  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { success: false, cancelled: true };
  }
  const dir = result.filePaths[0];
  try {
    const testFile = import_path.default.join(dir, ".test_write_permission");
    fs.writeFileSync(testFile, "test");
    fs.unlinkSync(testFile);
    backupConfig.backupDir = dir;
    saveConfig(backupConfig);
    return { success: true, cancelled: false, dirPath: dir };
  } catch (err) {
    return { success: false, cancelled: false, error: "\u65E0\u6CD5\u5199\u5165\u8BE5\u76EE\u5F55\uFF0C\u8BF7\u9009\u62E9\u5176\u4ED6\u76EE\u5F55" };
  }
});
import_electron.ipcMain.handle("auto-backup", async (event, data, fileName) => {
  if (!backupConfig.backupDir) {
    return { success: false, error: "\u672A\u8BBE\u7F6E\u5907\u4EFD\u76EE\u5F55" };
  }
  try {
    const filePath = import_path.default.join(backupConfig.backupDir, fileName);
    fs.writeFileSync(filePath, data, "utf-8");
    backupConfig.lastBackupTime = (/* @__PURE__ */ new Date()).toISOString();
    saveConfig(backupConfig);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});
import_electron.ipcMain.handle("check-backup-dir", async () => {
  if (!backupConfig.backupDir) {
    return { valid: false };
  }
  try {
    fs.accessSync(backupConfig.backupDir, fs.constants.W_OK);
    return { valid: true, dirPath: backupConfig.backupDir };
  } catch {
    return { valid: false };
  }
});
import_electron.ipcMain.handle("set-backup-dir", async (event, dirPath) => {
  try {
    fs.accessSync(dirPath, fs.constants.W_OK);
    backupConfig.backupDir = dirPath;
    saveConfig(backupConfig);
    return { success: true };
  } catch {
    return { success: false };
  }
});
import_electron.ipcMain.handle("get-backup-config", async () => {
  return {
    backupDir: backupConfig.backupDir,
    autoBackupEnabled: backupConfig.autoBackupEnabled,
    autoBackupInterval: backupConfig.autoBackupInterval,
    lastBackupTime: backupConfig.lastBackupTime
  };
});
import_electron.ipcMain.handle("set-auto-backup-enabled", async (event, enabled) => {
  backupConfig.autoBackupEnabled = enabled;
  saveConfig(backupConfig);
  return { success: true };
});
import_electron.ipcMain.handle("set-auto-backup-interval", async (event, interval) => {
  backupConfig.autoBackupInterval = interval;
  saveConfig(backupConfig);
  return { success: true };
});
import_electron.ipcMain.handle("save-backup-file", async (event, data, defaultName) => {
  if (!mainWindow) return { success: false, cancelled: true };
  const result = await import_electron.dialog.showSaveDialog(mainWindow, {
    title: "\u4FDD\u5B58\u5907\u4EFD\u6587\u4EF6",
    defaultPath: defaultName,
    filters: [{ name: "JSON \u6587\u4EF6", extensions: ["json"] }]
  });
  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true };
  }
  try {
    fs.writeFileSync(result.filePath, data, "utf-8");
    return { success: true, cancelled: false, filePath: result.filePath };
  } catch (err) {
    return { success: false, cancelled: false, error: String(err) };
  }
});
import_electron.ipcMain.on("close-after-backup", () => {
  if (mainWindow) {
    mainWindow.removeAllListeners("close");
    mainWindow.close();
  }
});
import_electron.app.whenReady().then(() => {
  createWindow();
  import_electron.app.on("activate", () => {
    if (import_electron.BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
import_electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    import_electron.app.quit();
  }
});

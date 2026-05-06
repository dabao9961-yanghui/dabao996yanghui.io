import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import * as fs from 'fs';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

interface BackupConfig {
  backupDir: string | null;
  autoBackupEnabled: boolean;
  autoBackupInterval: number;
  lastBackupTime: string | null;
}

const CONFIG_FILE_NAME = 'backup-config.json';

function getConfigPath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, CONFIG_FILE_NAME);
}

function loadConfig(): BackupConfig {
  const configPath = getConfigPath();
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load backup config:', err);
  }
  return {
    backupDir: null,
    autoBackupEnabled: false,
    autoBackupInterval: 30,
    lastBackupTime: null
  };
}

function saveConfig(config: BackupConfig): void {
  const configPath = getConfigPath();
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save backup config:', err);
  }
}

let backupConfig: BackupConfig = loadConfig();

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '工友记 - 记工天借支管理',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  if (process.env.VITE_DEV_SERVER_URL) {
    await mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (e) => {
    if (mainWindow) {
      e.preventDefault();
      mainWindow.webContents.send('request-backup-before-close');
    }
  });
}

ipcMain.handle('select-backup-dir', async () => {
  if (!mainWindow) return { success: false, cancelled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择备份目录',
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
    return { success: false, cancelled: true };
  }

  const dir = result.filePaths[0];
  
  try {
    const testFile = path.join(dir, '.test_write_permission');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    backupConfig.backupDir = dir;
    saveConfig(backupConfig);
    return { success: true, cancelled: false, dirPath: dir };
  } catch (err) {
    return { success: false, cancelled: false, error: '无法写入该目录，请选择其他目录' };
  }
});

ipcMain.handle('auto-backup', async (event, data: string, fileName: string) => {
  if (!backupConfig.backupDir) {
    return { success: false, error: '未设置备份目录' };
  }

  try {
    const filePath = path.join(backupConfig.backupDir, fileName);
    fs.writeFileSync(filePath, data, 'utf-8');
    backupConfig.lastBackupTime = new Date().toISOString();
    saveConfig(backupConfig);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: String(err) };
  }
});

ipcMain.handle('check-backup-dir', async () => {
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

ipcMain.handle('set-backup-dir', async (event, dirPath: string) => {
  try {
    fs.accessSync(dirPath, fs.constants.W_OK);
    backupConfig.backupDir = dirPath;
    saveConfig(backupConfig);
    return { success: true };
  } catch {
    return { success: false };
  }
});

ipcMain.handle('get-backup-config', async () => {
  return {
    backupDir: backupConfig.backupDir,
    autoBackupEnabled: backupConfig.autoBackupEnabled,
    autoBackupInterval: backupConfig.autoBackupInterval,
    lastBackupTime: backupConfig.lastBackupTime
  };
});

ipcMain.handle('set-auto-backup-enabled', async (event, enabled: boolean) => {
  backupConfig.autoBackupEnabled = enabled;
  saveConfig(backupConfig);
  return { success: true };
});

ipcMain.handle('set-auto-backup-interval', async (event, interval: number) => {
  backupConfig.autoBackupInterval = interval;
  saveConfig(backupConfig);
  return { success: true };
});

ipcMain.handle('save-backup-file', async (event, data: string, defaultName: string) => {
  if (!mainWindow) return { success: false, cancelled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存备份文件',
    defaultPath: defaultName,
    filters: [{ name: 'JSON 文件', extensions: ['json'] }],
  });

  if (result.canceled || !result.filePath) {
    return { success: false, cancelled: true };
  }

  try {
    fs.writeFileSync(result.filePath, data, 'utf-8');
    return { success: true, cancelled: false, filePath: result.filePath };
  } catch (err) {
    return { success: false, cancelled: false, error: String(err) };
  }
});

ipcMain.on('close-after-backup', () => {
  if (mainWindow) {
    mainWindow.removeAllListeners('close');
    mainWindow.close();
  }
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

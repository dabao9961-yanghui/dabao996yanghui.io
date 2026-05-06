import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatWorkDays } from '../utils';
import { Clock, Download, Upload, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ImeInput } from './ImeInput';
import type { AppSettings, Employee, WorkLog, Advance } from '../types';

function SettingsView({ onExport, onImport, isGuest, settings, onUpdateSettings, employees, workLogs, advances, projects }: { 
  onExport: () => void, 
  onImport: (data: string) => void, 
  isGuest: boolean,
  settings: AppSettings,
  onUpdateSettings: (s: Partial<AppSettings>) => void,
  employees: Employee[],
  workLogs: WorkLog[],
  advances: Advance[],
  projects: string[]
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupDirPath, setBackupDirPath] = useState<string>('');
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  useEffect(() => {
    const loadBackupConfig = async () => {
      try {
        const config = await window.electron.getBackupConfig();
        if (config.backupDir) {
          setBackupDirPath(config.backupDir);
        }
        if (config.lastBackupTime) {
          setLastBackupTime(config.lastBackupTime);
        }
        onUpdateSettings({
          autoBackupEnabled: config.autoBackupEnabled,
          autoBackupInterval: config.autoBackupInterval || 30,
          backupDirName: config.backupDir,
          lastBackupTime: config.lastBackupTime
        });
      } catch (err) {
        console.error('Load backup config error:', err);
      }
    };
    loadBackupConfig();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImport(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const selectBackupDir = async () => {
    try {
      const result = await window.electron.selectBackupDir();
      if (result.success) {
        setBackupDirPath(result.dirPath);
        await window.electron.setAutoBackupEnabled(true);
        onUpdateSettings({
          autoBackupEnabled: true,
          backupDirName: result.dirPath
        });
        alert(`已选择备份目录: ${result.dirPath}\n自动备份已启用。`);
      } else if (!result.cancelled && result.error) {
        alert(result.error);
      }
    } catch (err) {
      console.error('Directory picker error:', err);
      alert('选择目录失败');
    }
  };

  const manualBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = JSON.stringify({ employees, workLogs, advances, settings, projects, timestamp: new Date().toISOString() }, null, 2);
      const fileName = `工友记备份_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      const result = await window.electron.autoBackup(data, fileName);
      if (result.success) {
        setLastBackupTime(new Date().toISOString());
        alert(`备份成功!\n文件: ${result.filePath}`);
      } else {
        alert(`备份失败: ${result.error || '请先选择备份目录'}`);
      }
    } catch (err) {
      console.error('Backup error:', err);
      alert('备份失败，请检查目录权限或重新选择目录。');
    } finally {
      setIsBackingUp(false);
    }
  };

  const toggleAutoBackup = async (enabled: boolean) => {
    await window.electron.setAutoBackupEnabled(enabled);
    onUpdateSettings({ autoBackupEnabled: enabled });
  };

  const setBackupInterval = async (interval: number) => {
    await window.electron.setAutoBackupInterval(interval);
    onUpdateSettings({ autoBackupInterval: interval });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-3xl font-serif font-bold text-[#1A1A1A] mb-8">设置与备份</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-xl shadow-black/5 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-[#5A5A40]" />
              <h3 className="text-xl font-bold text-[#1A1A1A]">工时算法</h3>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium text-[#5A5A40]/60">标准工时 (多少小时等于 1 个工天)</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  value={settings.standardHoursPerDay}
                  onChange={e => onUpdateSettings({ standardHoursPerDay: parseFloat(e.target.value) || 8 })}
                  className="flex-1 bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none font-bold text-xl"
                />
                <span className="font-bold text-[#5A5A40]">小时/天</span>
              </div>
              <p className="text-xs text-[#5A5A40]/40 leading-relaxed">
                设置后，记工天时输入的工时将根据此标准自动折算为工天。              </p>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-xl shadow-black/5 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-6 h-6 text-[#5A5A40]" />
              <h3 className="text-xl font-bold text-[#1A1A1A]">自动备份 (本地目录)</h3>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-[#1A1A1A]">{settings.autoBackupEnabled ? '已启用自动备份' : '未启用自动备份'}</p>
                    {settings.autoBackupEnabled && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-600">
                        运行中                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5A5A40]/40 mt-1 truncate">
                    {backupDirPath ? `目录: ${backupDirPath}` : '请选择一个本地文件夹用于存放备份文件'}
                  </p>
                </div>
                <button 
                  onClick={selectBackupDir}
                  className="bg-[#5A5A40]/5 text-[#5A5A40] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#5A5A40]/10 transition-all shrink-0"
                >
                  {backupDirPath ? '更改目录' : '选择目录'}
                </button>
              </div>

              {settings.autoBackupEnabled && (
                <>
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-[#5A5A40]/60">备份间隔</label>
                    <div className="flex gap-2">
                      {[
                        { value: 10, label: '10分钟' },
                        { value: 30, label: '30分钟' },
                        { value: 60, label: '1小时' },
                        { value: 120, label: '2小时' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => setBackupInterval(opt.value)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xs font-bold transition-all",
                            settings.autoBackupInterval === opt.value
                              ? "bg-[#5A5A40] text-white"
                              : "bg-[#5A5A40]/5 text-[#5A5A40] hover:bg-[#5A5A40]/10"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {lastBackupTime && (
                    <p className="text-xs text-[#5A5A40]/40">
                      上次备份: {format(new Date(lastBackupTime), 'yyyy-MM-dd HH:mm:ss')}
                    </p>
                  )}

                  <div className="pt-4 border-t border-black/5 flex gap-4">
                    <button 
                      onClick={manualBackup}
                      disabled={isBackingUp}
                      className="flex-1 bg-[#5A5A40] text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-[#5A5A40]/10 hover:bg-[#4A4A30] transition-all disabled:opacity-50"
                    >
                      {isBackingUp ? '正在备份...' : '立即备份'}
                    </button>
                    <button 
                      onClick={() => toggleAutoBackup(false)}
                      className="px-4 py-3 border border-red-100 text-red-500 rounded-xl font-bold text-sm hover:bg-red-50 transition-all"
                    >
                      停用
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-xl shadow-black/5 space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-6 h-6 text-[#5A5A40]" />
            <h3 className="text-xl font-bold text-[#1A1A1A]">安全设置</h3>
          </div>
          <div className="space-y-4">
            <label className="text-sm font-medium text-[#5A5A40]/60">访问密码 (留空则不启用)</label>
            <input 
              type="password" 
              placeholder="设置进入密码"
              value={settings.appPassword || ''}
              onChange={e => onUpdateSettings({ appPassword: e.target.value })}
              className="w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none font-bold text-xl tracking-widest"
            />
            <p className="text-xs text-[#5A5A40]/40 leading-relaxed">
              启用后，每次打开应用都需要输入此密码。请务必牢记。</p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-xl shadow-black/5 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-emerald-50 rounded-[28px] flex items-center justify-center mb-6">
            <Download className="w-10 h-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">导出备份</h3>
          <p className="text-[#5A5A40]/60 text-sm mb-8 leading-relaxed">
            将所有工友信息、工天记录和借支数据导出为 JSON 文件，用于本地保存或更换设备。          </p>
          <button 
            onClick={onExport}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            立即导出
          </button>
        </div>

        <div className="bg-white rounded-[40px] p-10 border border-black/5 shadow-xl shadow-black/5 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-[28px] flex items-center justify-center mb-6">
            <Upload className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">导入数据</h3>
          <p className="text-[#5A5A40]/60 text-sm mb-8 leading-relaxed">
            从备份文件中恢复数据。注意：导入操作将覆盖当前设备上的所有本地数据。          </p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            选择文件导入
          </button>
        </div>
      </div>

      <div className="mt-12 bg-[#5A5A40]/5 rounded-[32px] p-8 flex items-start gap-4 border border-[#5A5A40]/10">
        <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shrink-0">
          <Info className="text-white w-6 h-6" />
        </div>
        <div>
          <h4 className="font-bold text-[#5A5A40] mb-2 text-lg">关于数据安全</h4>
          <p className="text-[#5A5A40]/70 text-sm leading-relaxed">
            {isGuest 
              ? "您当前正在使用本地模式。数据仅存储在您的浏览器缓存中。清除浏览器缓存或更换设备会导致数据丢失，请务必定期导出备份。"
              : "您已登录 Google 账号。数据会自动同步到云端，您可以随时在不同设备上登录查看。"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default SettingsView;

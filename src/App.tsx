import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, UserCog, BarChart3, Settings, Calendar, Wallet, Download, Clock, Info, Trash2, ChevronRight, AlertCircle, DollarSign, Search } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { cn, generateId, formatWorkDays } from './utils';
import {
  type Employee, type WorkLog, type Advance, type AppSettings,
  type TeamMode, type TeamMember, type Team, type TeamWorkLog, type TeamAdvance,
  Tab, type LocalData, OperationType,
} from './types';

import { auth, db } from './firebase';
import {
  GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User
} from 'firebase/auth';
import {
  collection, addDoc, deleteDoc, updateDoc, doc, setDoc,
  onSnapshot, query, where, orderBy
} from 'firebase/firestore';

import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import TeamManagement from './components/TeamManagement';
import TeamDetailView from './components/TeamDetailView';
import RecordManager from './components/RecordManager';
import SummaryView from './components/SummaryView';
import StatementView from './components/StatementView';
import SettingsView from './components/SettingsView';
import SalarySettlement from './components/SalarySettlement';
import ProjectCostSummary from './components/ProjectCostSummary';
import NavButton from './components/NavButton';

const LS_KEY = 'worker_tracker_data';

function getLocalData(): LocalData {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { employees: [], workLogs: [], advances: [], teams: [], teamWorkLogs: [], teamAdvances: [], settings: { standardHoursPerDay: 8 }, projects: [] };
    return JSON.parse(raw) as LocalData;
  } catch {
    return { employees: [], workLogs: [], advances: [], teams: [], teamWorkLogs: [], teamAdvances: [], settings: { standardHoursPerDay: 8 }, projects: [] };
  }
}

function saveLocalData(data: LocalData) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function handleFirestoreError(err: unknown, operationType: OperationType, path: string | null = null) {
  const authInfo = auth.currentUser
    ? { email: auth.currentUser.email, emailVerified: auth.currentUser.emailVerified, uid: auth.currentUser.uid.slice(-8) + '...' }
    : 'anonymous';
  const errorPayload = {
    error: err instanceof Error ? err.message : String(err),
    operationType,
    path,
    authInfo,
    timestamp: new Date().toISOString(),
  };
  console.error(JSON.stringify(errorPayload));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('is_guest') === 'true');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Dashboard);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamWorkLogs, setTeamWorkLogs] = useState<TeamWorkLog[]>([]);
  const [teamAdvances, setTeamAdvances] = useState<TeamAdvance[]>([]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [selectedEmployeeForRecord, setSelectedEmployeeForRecord] = useState<string | null>(null);
  const [selectedEmployeeForStatement, setSelectedEmployeeForStatement] = useState<string | null>(null);
  const [selectedTeamForDetail, setSelectedTeamForDetail] = useState<string | null>(null);
  const [employeeResetKey, setEmployeeResetKey] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({ standardHoursPerDay: 8 });
  const [projects, setProjects] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showExitBackup, setShowExitBackup] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  useEffect(() => {
    const electron = (window as any).electron;
    if (electron && electron.onCloseRequested) {
      electron.onCloseRequested(() => {
        setShowExitBackup(true);
      });
    }
  }, []);

  const handleExitBackup = async () => {
    setIsBackingUp(true);
    try {
      const data = { employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects };
      const jsonStr = JSON.stringify(data, null, 2);
      const defaultName = `${'工友记备份'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;

      const electron = (window as any).electron;
      if (electron && electron.saveBackupFile) {
        const result = await electron.saveBackupFile(jsonStr, defaultName);
        if (result.cancelled) {
          setIsBackingUp(false);
          return;
        }
        if (!result.success) {
          console.error('Backup failed:', result.error);
        }
      } else {
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = defaultName;
        a.click();
        URL.revokeObjectURL(url);
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (err) {
      console.error('Backup error:', err);
    }
    setIsBackingUp(false);
    setShowExitBackup(false);
    const electron = (window as any).electron;
    if (electron && electron.closeAfterBackup) {
      electron.closeAfterBackup();
    }
  };

  const handleExitNoBackup = () => {
    setShowExitBackup(false);
    const electron = (window as any).electron;
    if (electron && electron.closeAfterBackup) {
      electron.closeAfterBackup();
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      setIsAuthReady(true);
      if (u) {
        setIsGuest(false);
        localStorage.removeItem('is_guest');
      }
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const logout = () => {
    signOut(auth);
    setIsGuest(false);
    localStorage.removeItem('is_guest');
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('is_guest', 'true');
  };

  const performAutoBackup = useCallback(async () => {
    if (!settings.autoBackupEnabled) return;
    try {
      const d = { employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects, timestamp: new Date().toISOString() };
      const data = JSON.stringify(d, null, 2);
      const fileName = `${'工友记自动备份'}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      const w = window as any;
      const result = await w.electron.autoBackup(data, fileName);
      if (result.success) {
        console.log('Auto-backup successful:', result.filePath);
      } else {
        console.error('Auto-backup failed:', result.error);
      }
    } catch (err) {
      console.error('Auto-backup error:', err);
    }
  }, [settings.autoBackupEnabled, employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects]);

  useEffect(() => {
    if (!settings.autoBackupEnabled || !settings.autoBackupInterval) return;
    const intervalMs = settings.autoBackupInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      performAutoBackup();
    }, intervalMs);
    return () => clearInterval(intervalId);
  }, [settings.autoBackupEnabled, settings.autoBackupInterval, performAutoBackup]);

  useEffect(() => {
    if (isGuest) {
      const data = getLocalData();
      setEmployees(data.employees);
      setWorkLogs(data.workLogs);
      setAdvances(data.advances);
      setTeams(data.teams || []);
      setTeamWorkLogs(data.teamWorkLogs || []);
      setTeamAdvances(data.teamAdvances || []);
      setSettings(data.settings || { standardHoursPerDay: 8 });
      setProjects(data.projects || []);
      if (data.settings?.appPassword) {
        setIsLocked(true);
      }
      return;
    }

    if (!user || !isAuthReady) return;

    const employeesQuery = query(collection(db, 'employees'), where('ownerId', '==', user.uid));
    const workLogsQuery = query(collection(db, 'workLogs'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));
    const advancesQuery = query(collection(db, 'advances'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));
    const settingsQuery = query(collection(db, 'settings'), where('ownerId', '==', user.uid));

    const teamsQuery = query(collection(db, 'teams'), where('ownerId', '==', user.uid));
    const teamWorkLogsQuery = query(collection(db, 'teamWorkLogs'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));
    const teamAdvancesQuery = query(collection(db, 'teamAdvances'), where('ownerId', '==', user.uid), orderBy('date', 'desc'));

    const unsubEmployees = onSnapshot(employeesQuery, (s) => { setEmployees(s.docs.map(d => ({ id: d.id, ...d.data() } as Employee))); }, (err) => handleFirestoreError(err, OperationType.LIST, 'employees'));
    const unsubWorkLogs = onSnapshot(workLogsQuery, (s) => { setWorkLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as WorkLog))); }, (err) => handleFirestoreError(err, OperationType.LIST, 'workLogs'));
    const unsubAdvances = onSnapshot(advancesQuery, (s) => { setAdvances(s.docs.map(d => ({ id: d.id, ...d.data() } as Advance))); }, (err) => handleFirestoreError(err, OperationType.LIST, 'advances'));

    const unsubSettings = onSnapshot(settingsQuery, (s) => {
      if (!s.empty) {
        const st = s.docs[0].data() as AppSettings;
        setSettings(st);
        if (st.appPassword) setIsLocked(true);
      }
    });

    const unsubTeams = onSnapshot(teamsQuery, (s) => { setTeams(s.docs.map(d => ({ id: d.id, ...d.data() } as Team))); });
    const unsubTeamWorkLogs = onSnapshot(teamWorkLogsQuery, (s) => { setTeamWorkLogs(s.docs.map(d => ({ id: d.id, ...d.data() } as TeamWorkLog))); });
    const unsubTeamAdvances = onSnapshot(teamAdvancesQuery, (s) => { setTeamAdvances(s.docs.map(d => ({ id: d.id, ...d.data() } as TeamAdvance))); });

    return () => {
      unsubEmployees(); unsubWorkLogs(); unsubAdvances(); unsubSettings();
      unsubTeams(); unsubTeamWorkLogs(); unsubTeamAdvances();
    };
  }, [user, isAuthReady, isGuest]);

  const handleAddEmployee = async (name: string, phone: string, dailyWage?: number, hoursPerDay?: number, avatar?: string) => {
    const ownerId = user?.uid || 'guest';
    const newEmp: Employee = { id: isGuest ? generateId() : '', name, phone, dailyWage, hoursPerDay, avatar, ownerId };
    if (isGuest) {
      const data = getLocalData();
      data.employees.push(newEmp);
      saveLocalData(data);
      setEmployees([...data.employees]);
    } else {
      await addDoc(collection(db, 'employees'), { ...newEmp, createdAt: new Date().toISOString() });
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (isGuest) {
      const data = getLocalData();
      data.employees = data.employees.filter(e => e.id !== id);
      data.workLogs = data.workLogs.filter(l => l.employeeId !== id);
      data.advances = data.advances.filter(a => a.employeeId !== id);
      saveLocalData(data);
      setEmployees([...data.employees]);
      setWorkLogs([...data.workLogs]);
      setAdvances([...data.advances]);
    } else {
      await deleteDoc(doc(db, 'employees', id));
      const empWorkLogs = workLogs.filter(l => l.employeeId === id);
      const empAdvances = advances.filter(a => a.employeeId === id);
      for (const l of empWorkLogs) await deleteDoc(doc(db, 'workLogs', l.id));
      for (const a of empAdvances) await deleteDoc(doc(db, 'advances', a.id));
    }
    setShowDeleteConfirm(null);
    setDeleteConfirmText('');
  };

  const handleUpdateEmployeeAvatar = async (id: string, avatar: string) => {
    if (isGuest) {
      const data = getLocalData();
      const idx = data.employees.findIndex(e => e.id === id);
      if (idx !== -1) { data.employees[idx] = { ...data.employees[idx], avatar }; saveLocalData(data); setEmployees([...data.employees]); }
    } else {
      await updateDoc(doc(db, 'employees', id), { avatar });
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    if (isGuest) {
      const data = getLocalData();
      const idx = data.employees.findIndex(e => e.id === id);
      if (idx !== -1) { data.employees[idx] = { ...data.employees[idx], ...updates }; saveLocalData(data); setEmployees([...data.employees]); }
    } else {
      await updateDoc(doc(db, 'employees', id), updates);
    }
  };

  const handleAddProject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || projects.includes(trimmed)) return;
    const updated = [...projects, trimmed];
    setProjects(updated);
    if (isGuest) { const data = getLocalData(); data.projects = updated; saveLocalData(data); }
  };

  const handleDeleteProject = (name: string) => {
    const updated = projects.filter(p => p !== name);
    setProjects(updated);
    if (isGuest) { const data = getLocalData(); data.projects = updated; saveLocalData(data); }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (isGuest) { const data = getLocalData(); data.settings = updated; saveLocalData(data); }
    else if (user) { try { await setDoc(doc(db, 'settings', user.uid), { ...updated, ownerId: user.uid }); } catch (error) { handleFirestoreError(error, OperationType.UPDATE, `settings/${user.uid}`); } }
  };

  const handleAddWorkLog = async (log: Omit<WorkLog, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) { const data = getLocalData(); const newLog = { ...log, id: generateId(), ownerId }; data.workLogs.unshift(newLog); saveLocalData(data); setWorkLogs([...data.workLogs]); }
    else { await addDoc(collection(db, 'workLogs'), { ...log, ownerId }); }
  };

  const handleAddAdvance = async (adv: Omit<Advance, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) { const data = getLocalData(); const newAdv = { ...adv, id: generateId(), ownerId }; data.advances.unshift(newAdv); saveLocalData(data); setAdvances([...data.advances]); }
    else { await addDoc(collection(db, 'advances'), { ...adv, ownerId }); }
  };

  const handleDeleteRecord = async (id: string, type: 'work' | 'advance') => {
    if (isGuest) {
      const data = getLocalData();
      if (type === 'work') data.workLogs = data.workLogs.filter(l => l.id !== id);
      else data.advances = data.advances.filter(a => a.id !== id);
      saveLocalData(data);
      setWorkLogs([...data.workLogs]);
      setAdvances([...data.advances]);
    } else { await deleteDoc(doc(db, type === 'work' ? 'workLogs' : 'advances', id)); }
  };

  const handleAddTeam = async (name: string, mode: TeamMode, hoursPerDay?: number, dailyWage?: number, avatar?: string, members?: TeamMember[]) => {
    const ownerId = user?.uid || 'guest';
    const newTeam: Team = { id: isGuest ? generateId() : '', name, mode, hoursPerDay, dailyWage, avatar, members, ownerId };
    if (isGuest) { const data = getLocalData(); data.teams.push(newTeam); saveLocalData(data); setTeams([...data.teams]); }
    else { await addDoc(collection(db, 'teams'), { ...newTeam, createdAt: new Date().toISOString() }); }
  };

  const handleDeleteTeam = async (id: string) => {
    if (isGuest) {
      const data = getLocalData();
      data.teams = data.teams.filter(t => t.id !== id);
      data.teamWorkLogs = data.teamWorkLogs.filter(l => l.teamId !== id);
      data.teamAdvances = data.teamAdvances.filter(a => a.teamId !== id);
      saveLocalData(data);
      setTeams([...data.teams]); setTeamWorkLogs([...data.teamWorkLogs]); setTeamAdvances([...data.teamAdvances]);
    } else {
      await deleteDoc(doc(db, 'teams', id));
      const tLogs = teamWorkLogs.filter(l => l.teamId === id);
      const tAdvs = teamAdvances.filter(a => a.teamId === id);
      for (const l of tLogs) await deleteDoc(doc(db, 'teamWorkLogs', l.id));
      for (const a of tAdvs) await deleteDoc(doc(db, 'teamAdvances', a.id));
    }
  };

  const handleUpdateTeam = async (id: string, updates: Partial<Team>) => {
    if (isGuest) { const data = getLocalData(); const idx = data.teams.findIndex(t => t.id === id); if (idx >= 0) { data.teams[idx] = { ...data.teams[idx], ...updates }; saveLocalData(data); setTeams([...data.teams]); } }
    else { await updateDoc(doc(db, 'teams', id), updates); }
  };

  const handleAddTeamWorkLog = async (log: Omit<TeamWorkLog, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) { const data = getLocalData(); const newLog = { ...log, id: generateId(), ownerId }; data.teamWorkLogs.unshift(newLog); saveLocalData(data); setTeamWorkLogs([...data.teamWorkLogs]); }
    else { await addDoc(collection(db, 'teamWorkLogs'), { ...log, ownerId }); }
  };

  const handleAddTeamAdvance = async (adv: Omit<TeamAdvance, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) { const data = getLocalData(); const newAdv = { ...adv, id: generateId(), ownerId }; data.teamAdvances.unshift(newAdv); saveLocalData(data); setTeamAdvances([...data.teamAdvances]); }
    else { await addDoc(collection(db, 'teamAdvances'), { ...adv, ownerId }); }
  };

  const handleDeleteTeamRecord = async (id: string, type: 'work' | 'advance') => {
    if (isGuest) {
      const data = getLocalData();
      if (type === 'work') data.teamWorkLogs = data.teamWorkLogs.filter(l => l.id !== id);
      else data.teamAdvances = data.teamAdvances.filter(a => a.id !== id);
      saveLocalData(data);
      setTeamWorkLogs([...data.teamWorkLogs]); setTeamAdvances([...data.teamAdvances]);
    } else { await deleteDoc(doc(db, type === 'work' ? 'teamWorkLogs' : 'teamAdvances', id)); }
  };

  const handleImport = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.employees || data.workLogs || data.advances || data.teams) {
        if (isGuest) {
          const importData = {
            employees: data.employees || [], workLogs: data.workLogs || [], advances: data.advances || [],
            teams: data.teams || [], teamWorkLogs: data.teamWorkLogs || [], teamAdvances: data.teamAdvances || [],
            settings: data.settings || { standardHoursPerDay: 8 }, projects: data.projects || []
          };
          saveLocalData(importData);
          setEmployees(importData.employees); setWorkLogs(importData.workLogs); setAdvances(importData.advances);
          setTeams(importData.teams); setTeamWorkLogs(importData.teamWorkLogs); setTeamAdvances(importData.teamAdvances);
          setSettings(importData.settings); setProjects(importData.projects);
          alert('导入成功！');
        } else { alert('请在离线模式下使用导入功能，或联系管理员同步数据。'); }
      } else { alert('文件格式不正确，未找到有效数据。'); }
    } catch { alert('导入失败，请检查文件格式。'); }
  };

  const handleExport = () => {
    const data = isGuest ? getLocalData() : { employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `${'工友记备份'}_${format(new Date(), 'yyyyMMdd')}.json`; a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A5A40]" />
      </div>
    );
  }

  if (isLocked && settings.appPassword) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-black/5 border border-white">
          <div className="w-20 h-20 bg-[#5A5A40] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#5A5A40]/20">
            <Info className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-2">请输入访问密码</h1>
          <p className="text-[#5A5A40]/50 mb-8 text-sm">为了您的数据安全，请输入密码进入</p>
          <input type="password" placeholder="输入密码" value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
            autoComplete="off" data-lpignore="true"
            className={cn("w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none focus:ring-2 text-center text-xl tracking-widest", passwordError && "ring-2 ring-red-400 bg-red-50/50")} />
          <AnimatePresence>
            {passwordError && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 justify-center text-red-500 text-sm mb-4 mt-2">
                <AlertCircle className="w-4 h-4" /><span>密码错误，请重新输入</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button onClick={() => { if (passwordInput === settings.appPassword) { setIsLocked(false); setPasswordInput(''); } else setPasswordError(true); }}
            className="w-full bg-[#5A5A40] text-white rounded-2xl py-4 font-bold hover:bg-[#4A4A30] transition-all shadow-md mt-4">进入系统</button>
        </motion.div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-black/5 border border-white">
          <div className="w-24 h-24 bg-[#5A5A40] rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#5A5A40]/20">
            <Calendar className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] mb-4">工友记</h1>
          <p className="text-[#5A5A40]/70 mb-10 leading-relaxed">专业的记工天、记借支管理工具。<br />支持云端同步与本地备份。</p>
          <div className="space-y-4">
            <button onClick={login}
              className="w-full bg-[#5A5A40] text-white rounded-2xl py-4 font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-3 shadow-md">
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />使用 Google 登录</button>
            <button onClick={continueAsGuest}
              className="w-full bg-white text-[#5A5A40] border-2 border-[#5A5A40]/10 rounded-2xl py-4 font-bold hover:bg-[#5A5A40]/5 transition-all gap-3 flex items-center justify-center">
              <Users className="w-5 h-5" />直接开始使用(本地模式)</button>
          </div>
          <p className="mt-8 text-xs text-[#5A5A40]/40">本地模式数据存储在浏览器中，建议定期备份。</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setActiveTab(Tab.Dashboard); }}>
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-serif font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors">工友记</h1>
            {isGuest && <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">本地</span>}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab(Tab.SalarySettlement)}
              className={cn("p-2 rounded-xl transition-colors", activeTab === Tab.SalarySettlement ? "bg-[#5A5A40]/10 text-[#5A5A40]" : "text-[#5A5A40]/40 hover:text-[#5A5A40]")}>
              <DollarSign className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab(Tab.Settings)}
              className={cn("p-2 rounded-xl transition-colors", activeTab === Tab.Settings ? "bg-[#5A5A40]/10 text-[#5A5A40]" : "text-[#5A5A40]/40 hover:text-[#5A5A40]")}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === Tab.Dashboard && (
            <Dashboard employees={employees} workLogs={workLogs} advances={advances}
              teams={teams} teamWorkLogs={teamWorkLogs} teamAdvances={teamAdvances} />
          )}
          {activeTab === Tab.Employees && (
            <EmployeeList employees={employees} workLogs={workLogs} advances={advances}
              onAdd={handleAddEmployee} onDelete={handleDeleteEmployee}
              onUpdateAvatar={handleUpdateEmployeeAvatar} onUpdateEmployee={handleUpdateEmployee}
              resetTrigger={employeeResetKey} onRecord={(id) => { setSelectedEmployeeForRecord(id); setActiveTab(Tab.Records); }}
              onShowDeleteConfirm={setShowDeleteConfirm} />
          )}
          {activeTab === Tab.Teams && (
            <TeamManagement teams={teams} teamWorkLogs={teamWorkLogs} teamAdvances={teamAdvances}
              onAdd={handleAddTeam} onDelete={handleDeleteTeam} onUpdateTeam={handleUpdateTeam}
              onShowDeleteConfirm={setShowDeleteConfirm}
              onViewDetail={(id) => { setSelectedTeamForDetail(id); setActiveTab(Tab.TeamDetail); }} />
          )}
          {activeTab === Tab.TeamDetail && selectedTeamForDetail && (
            <TeamDetailView
              team={teams.find(t => t.id === selectedTeamForDetail)!}
              teamWorkLogs={teamWorkLogs.filter(l => l.teamId === selectedTeamForDetail)}
              teamAdvances={teamAdvances.filter(a => a.teamId === selectedTeamForDetail)}
              onBack={() => setActiveTab(Tab.Teams)} onAddWorkLog={handleAddTeamWorkLog}
              onAddAdvance={handleAddTeamAdvance} onDeleteRecord={handleDeleteTeamRecord}
              onUpdateTeam={handleUpdateTeam} savedProjects={projects}
              onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} />
          )}
          {activeTab === Tab.Records && (
            <RecordManager employees={employees} workLogs={workLogs} advances={advances}
              onAddWork={handleAddWorkLog} onAddAdvance={handleAddAdvance} onDelete={handleDeleteRecord}
              initialEmployeeId={selectedEmployeeForRecord} onClearInitial={() => setSelectedEmployeeForRecord(null)}
              standardHours={settings.standardHoursPerDay} savedProjects={projects}
              onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} />
          )}
          {activeTab === Tab.Summary && (
            <SummaryView employees={employees} workLogs={workLogs} advances={advances}
              teams={teams} teamWorkLogs={teamWorkLogs} teamAdvances={teamAdvances}
              onViewStatement={(id) => { setSelectedEmployeeForStatement(id); setActiveTab(Tab.Statement); }} />
          )}
          {activeTab === Tab.Statement && selectedEmployeeForStatement && (() => {
            const emp = employees.find(e => e.id === selectedEmployeeForStatement);
            if (!emp) return null;
            return (
              <StatementView employee={emp}
                workLogs={workLogs.filter(l => l.employeeId === selectedEmployeeForStatement)}
                advances={advances.filter(a => a.employeeId === selectedEmployeeForStatement)}
                onBack={() => { setActiveTab(Tab.Summary); setSelectedEmployeeForStatement(''); }} />
            );
          })()}
          {activeTab === Tab.Settings && (
            <SettingsView onExport={handleExport} onImport={handleImport} isGuest={isGuest}
              settings={settings} onUpdateSettings={updateSettings} employees={employees}
              workLogs={workLogs} advances={advances} projects={projects} />
          )}
          {activeTab === Tab.SalarySettlement && (
            <SalarySettlement employees={employees} workLogs={workLogs} advances={advances}
              teams={teams} teamWorkLogs={teamWorkLogs} teamAdvances={teamAdvances}
              onBack={() => setActiveTab(Tab.Summary)} />
          )}
          {activeTab === Tab.ProjectCost && (
            <ProjectCostSummary employees={employees} workLogs={workLogs} advances={advances}
              teamWorkLogs={teamWorkLogs} teamAdvances={teamAdvances}
              onBack={() => setActiveTab(Tab.Summary)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">确认删除？</h3>
                <p className="text-[#5A5A40]/60 text-sm mb-6">删除后相关记录将永久丢失。请输入 <span className="font-bold text-red-500">确定</span> 以确认。</p>
                <input type="text" placeholder="输入 '确定'" value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none mb-6 border border-black/5" />
                <div className="flex gap-3">
                  <button onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all">取消</button>
                  <button disabled={deleteConfirmText !== '确定'}
                    onClick={() => {
                      if (teams.find(t => t.id === showDeleteConfirm)) handleDeleteTeam(showDeleteConfirm);
                      else handleDeleteEmployee(showDeleteConfirm);
                    }}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none transition-all">确认删除</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExitBackup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Download className="text-emerald-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 text-center">退出前备份数据</h3>
                <p className="text-[#5A5A40]/60 text-sm mb-8 text-center">建议在退出前导出一份备份，防止数据丢失。</p>
                <div className="space-y-3">
                  <button onClick={handleExitBackup} disabled={isBackingUp}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />{isBackingUp ? '正在备份...' : '备份并退出'}</button>
                  <button onClick={handleExitNoBackup}
                    className="w-full py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all">直接退出</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-black/5 rounded-full px-4 py-2 shadow-2xl shadow-black/10 flex items-center gap-2 z-20">
        <NavButton active={activeTab === Tab.Dashboard || activeTab === Tab.ProjectCost}
          onClick={() => setActiveTab(Tab.Dashboard)} icon={<BarChart3 className="w-5 h-5" />} label="首页" />
        <NavButton active={activeTab === Tab.Employees}
          onClick={() => setActiveTab(Tab.Employees)} icon={<Users className="w-5 h-5" />} label="工友" />
        <NavButton active={activeTab === Tab.Teams || activeTab === Tab.TeamDetail}
          onClick={() => setActiveTab(Tab.Teams)} icon={<UserCog className="w-5 h-5" />} label="班组" />
        <NavButton active={activeTab === Tab.Summary || activeTab === Tab.Statement}
          onClick={() => { setActiveTab(Tab.Summary); setSelectedEmployeeForStatement(''); }}
          icon={<Wallet className="w-5 h-5" />} label="统计" />
      </nav>
    </div>
  );
}

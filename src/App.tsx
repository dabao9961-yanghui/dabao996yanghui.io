/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  auth, db 
} from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc,
  setDoc,
  updateDoc,
  orderBy
} from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Plus, 
  Trash2, 
  LogOut, 
  ChevronRight, 
  BarChart3,
  Clock,
  DollarSign,
  AlertCircle,
  Search,
  Download,
  Upload,
  UserPlus,
  Settings,
  Info,
  Phone,
  Camera,
  UserCog,
  Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

function ImeInput({ value, onChange, className, placeholder, type = 'text', onKeyDown }: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [composing, setComposing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!composing) {
      setLocalValue(value);
    }
  }, [value, composing]);

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={composing ? localValue : value}
      onChange={e => {
        const v = e.target.value;
        if (composing) {
          setLocalValue(v);
        } else {
          onChange(v);
        }
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={e => {
        setComposing(false);
        const v = (e.target as HTMLInputElement).value;
        onChange(v);
        setLocalValue(v);
      }}
      onKeyDown={onKeyDown}
      className={className}
    />
  );
}

function ImeTextarea({ value, onChange, className, placeholder, rows }: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  rows?: number;
}) {
  const [composing, setComposing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    if (!composing) {
      setLocalValue(value);
    }
  }, [value, composing]);

  return (
    <textarea
      placeholder={placeholder}
      rows={rows}
      value={composing ? localValue : value}
      onChange={e => {
        const v = e.target.value;
        if (composing) {
          setLocalValue(v);
        } else {
          onChange(v);
        }
      }}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={e => {
        setComposing(false);
        const v = (e.target as HTMLTextAreaElement).value;
        onChange(v);
        setLocalValue(v);
      }}
      className={className}
    />
  );
}

function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        200,
        200
      );
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    image.src = imageSrc;
  });
}

function AvatarCropper({ imageSrc, onCrop, onCancel }: { imageSrc: string, onCrop: (result: string) => void, onCancel: () => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = (_croppedArea: Area, croppedAreaPx: Area) => {
    setCroppedAreaPixels(croppedAreaPx);
  };

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const result = await getCroppedImg(imageSrc, croppedAreaPixels);
    onCrop(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl space-y-4"
      >
        <h3 className="font-bold text-[#1A1A1A] text-center">裁剪头像</h3>
        <div className="relative w-full h-64 bg-[#F5F5F0] rounded-2xl overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#5A5A40]/40 font-bold">缩放</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-[#5A5A40]"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl font-bold bg-[#5A5A40] text-white shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all"
          >
            确认裁剪
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// --- Types ---
interface Employee {
  id: string;
  name: string;
  phone?: string;
  dailyWage?: number;
  hoursPerDay?: number;
  avatar?: string;
  ownerId: string;
}

interface WorkLog {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  workDayValue: number;
  project?: string;
  description?: string;
  ownerId: string;
}

interface AppSettings {
  standardHoursPerDay: number;
  appPassword?: string;
  autoBackupEnabled?: boolean;
  autoBackupInterval?: number;
  backupDirName?: string;
  lastBackupTime?: string;
}

type TeamMode = 'employee' | 'leader';

interface TeamMember {
  id: string;
  name: string;
}

interface Team {
  id: string;
  name: string;
  mode: TeamMode;
  hoursPerDay?: number;
  dailyWage?: number;
  avatar?: string;
  members?: TeamMember[];
  ownerId: string;
}

interface TeamWorkLog {
  id: string;
  teamId: string;
  date: string;
  workerCount: number;
  memberId?: string;
  memberName?: string;
  hours?: number;
  project?: string;
  description?: string;
  ownerId: string;
}

interface TeamAdvance {
  id: string;
  teamId: string;
  date: string;
  amount: number;
  description?: string;
  ownerId: string;
}

interface Advance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  description?: string;
  ownerId: string;
}

enum Tab {
  Employees = 'employees',
  Teams = 'teams',
  Records = 'records',
  Summary = 'summary',
  Settings = 'settings',
  Statement = 'statement',
  TeamDetail = 'teamDetail'
}

// --- Local Storage Helpers ---
const LOCAL_STORAGE_KEY = 'worker_tracker_data';

interface LocalData {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teams: Team[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
  settings: AppSettings;
  projects: string[];
}

const getLocalData = (): LocalData => {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!data) return { 
    employees: [], 
    workLogs: [], 
    advances: [],
    teams: [],
    teamWorkLogs: [],
    teamAdvances: [],
    settings: { standardHoursPerDay: 8 },
    projects: []
  };
  const parsed = JSON.parse(data);
  return {
    employees: parsed.employees || [],
    workLogs: parsed.workLogs || [],
    advances: parsed.advances || [],
    teams: parsed.teams || [],
    teamWorkLogs: parsed.teamWorkLogs || [],
    teamAdvances: parsed.teamAdvances || [],
    settings: parsed.settings || { standardHoursPerDay: 8 },
    projects: parsed.projects || []
  };
};

const formatWorkDays = (n: number) => {
  if (!isFinite(n)) return '0';
  const rounded = Math.round(n * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
};

const saveLocalData = (data: LocalData) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
};

// --- Error Handling ---
enum OperationType {
  UPDATE = 'update',
  LIST = 'list',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

// --- Components ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem('is_guest') === 'true');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Employees);
  
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
      const defaultName = `工友记备份_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      
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

  // --- Auth ---
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

  // --- Auto Backup (Electron) ---
  const performAutoBackup = useCallback(async () => {
    if (!settings.autoBackupEnabled) return;
    try {
      const data = JSON.stringify({ employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects, timestamp: new Date().toISOString() }, null, 2);
      const fileName = `工友记自动备份_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      const result = await window.electron.autoBackup(data, fileName);
      if (result.success) {
        console.log('Auto-backup successful:', result.filePath);
      } else {
        console.error('Auto-backup failed:', result.error);
      }
    } catch (err) {
      console.error('Auto-backup error:', err);
    }
  }, [settings.autoBackupEnabled, employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects]);

  // Scheduled auto backup based on interval
  useEffect(() => {
    if (!settings.autoBackupEnabled || !settings.autoBackupInterval) return;
    
    const intervalMs = settings.autoBackupInterval * 60 * 1000;
    const intervalId = setInterval(() => {
      performAutoBackup();
    }, intervalMs);
    
    return () => clearInterval(intervalId);
  }, [settings.autoBackupEnabled, settings.autoBackupInterval, performAutoBackup]);

  // Backup on close
  useEffect(() => {
    if (!settings.autoBackupEnabled) return;
    const handleUnload = () => {
      performAutoBackup();
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [settings.autoBackupEnabled, performAutoBackup]);

  // --- Data Fetching ---
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

    const unsubEmployees = onSnapshot(employeesQuery, (snapshot) => {
      setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Employee)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'employees'));

    const unsubWorkLogs = onSnapshot(workLogsQuery, (snapshot) => {
      setWorkLogs(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as WorkLog)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'workLogs'));

    const unsubAdvances = onSnapshot(advancesQuery, (snapshot) => {
      setAdvances(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Advance)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'advances'));

    const unsubSettings = onSnapshot(settingsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const s = snapshot.docs[0].data() as AppSettings;
        setSettings(s);
        if (s.appPassword) setIsLocked(true);
      }
    });

    return () => {
      unsubEmployees();
      unsubWorkLogs();
      unsubAdvances();
      unsubSettings();
    };
  }, [user, isAuthReady, isGuest]);

  // --- Actions ---
  const handleAddEmployee = async (name: string, phone: string, dailyWage?: number, hoursPerDay?: number, avatar?: string) => {
    const ownerId = user?.uid || 'guest';
    const newEmp: Employee = {
      id: isGuest ? generateId() : '',
      name,
      phone,
      dailyWage,
      hoursPerDay,
      avatar,
      ownerId
    };

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
    }
    setShowDeleteConfirm(null);
    setDeleteConfirmText('');
  };

  const handleUpdateEmployeeAvatar = async (id: string, avatar: string) => {
    if (isGuest) {
      const data = getLocalData();
      const idx = data.employees.findIndex(e => e.id === id);
      if (idx !== -1) {
        data.employees[idx] = { ...data.employees[idx], avatar };
        saveLocalData(data);
        setEmployees([...data.employees]);
      }
    } else {
      await updateDoc(doc(db, 'employees', id), { avatar });
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    if (isGuest) {
      const data = getLocalData();
      const idx = data.employees.findIndex(e => e.id === id);
      if (idx !== -1) {
        data.employees[idx] = { ...data.employees[idx], ...updates };
        saveLocalData(data);
        setEmployees([...data.employees]);
      }
    } else {
      await updateDoc(doc(db, 'employees', id), updates);
    }
  };

  const handleAddProject = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || projects.includes(trimmed)) return;
    const updated = [...projects, trimmed];
    setProjects(updated);
    if (isGuest) {
      const data = getLocalData();
      data.projects = updated;
      saveLocalData(data);
    }
  };

  const handleDeleteProject = (name: string) => {
    const updated = projects.filter(p => p !== name);
    setProjects(updated);
    if (isGuest) {
      const data = getLocalData();
      data.projects = updated;
      saveLocalData(data);
    }
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (isGuest) {
      const data = getLocalData();
      data.settings = updated;
      saveLocalData(data);
    } else if (user) {
      try {
        await setDoc(doc(db, 'settings', user.uid), { ...updated, ownerId: user.uid });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `settings/${user.uid}`);
      }
    }
  };

  const handleAddWorkLog = async (log: Omit<WorkLog, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) {
      const data = getLocalData();
      const newLog = { ...log, id: generateId(), ownerId };
      data.workLogs.unshift(newLog);
      saveLocalData(data);
      setWorkLogs([...data.workLogs]);
    } else {
      await addDoc(collection(db, 'workLogs'), { ...log, ownerId });
    }
  };

  const handleAddAdvance = async (adv: Omit<Advance, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) {
      const data = getLocalData();
      const newAdv = { ...adv, id: generateId(), ownerId };
      data.advances.unshift(newAdv);
      saveLocalData(data);
      setAdvances([...data.advances]);
    } else {
      await addDoc(collection(db, 'advances'), { ...adv, ownerId });
    }
  };

  const handleDeleteRecord = async (id: string, type: 'work' | 'advance') => {
    if (isGuest) {
      const data = getLocalData();
      if (type === 'work') data.workLogs = data.workLogs.filter(l => l.id !== id);
      else data.advances = data.advances.filter(a => a.id !== id);
      saveLocalData(data);
      setWorkLogs([...data.workLogs]);
      setAdvances([...data.advances]);
    } else {
      await deleteDoc(doc(db, type === 'work' ? 'workLogs' : 'advances', id));
    }
  };

  const handleAddTeam = async (name: string, mode: TeamMode, hoursPerDay?: number, dailyWage?: number, avatar?: string, members?: TeamMember[]) => {
    const ownerId = user?.uid || 'guest';
    const newTeam: Team = {
      id: isGuest ? generateId() : '',
      name,
      mode,
      hoursPerDay,
      dailyWage,
      avatar,
      members,
      ownerId
    };
    if (isGuest) {
      const data = getLocalData();
      data.teams.push(newTeam);
      saveLocalData(data);
      setTeams([...data.teams]);
    } else {
      await addDoc(collection(db, 'teams'), { ...newTeam, createdAt: new Date().toISOString() });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (isGuest) {
      const data = getLocalData();
      data.teams = data.teams.filter(t => t.id !== id);
      data.teamWorkLogs = data.teamWorkLogs.filter(l => l.teamId !== id);
      data.teamAdvances = data.teamAdvances.filter(a => a.teamId !== id);
      saveLocalData(data);
      setTeams([...data.teams]);
      setTeamWorkLogs([...data.teamWorkLogs]);
      setTeamAdvances([...data.teamAdvances]);
    } else {
      await deleteDoc(doc(db, 'teams', id));
    }
  };

  const handleUpdateTeam = async (id: string, updates: Partial<Team>) => {
    if (isGuest) {
      const data = getLocalData();
      const idx = data.teams.findIndex(t => t.id === id);
      if (idx >= 0) {
        data.teams[idx] = { ...data.teams[idx], ...updates };
        saveLocalData(data);
        setTeams([...data.teams]);
      }
    } else {
      await updateDoc(doc(db, 'teams', id), updates);
    }
  };

  const handleAddTeamWorkLog = async (log: Omit<TeamWorkLog, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) {
      const data = getLocalData();
      const newLog = { ...log, id: generateId(), ownerId };
      data.teamWorkLogs.unshift(newLog);
      saveLocalData(data);
      setTeamWorkLogs([...data.teamWorkLogs]);
    } else {
      await addDoc(collection(db, 'teamWorkLogs'), { ...log, ownerId });
    }
  };

  const handleAddTeamAdvance = async (adv: Omit<TeamAdvance, 'id' | 'ownerId'>) => {
    const ownerId = user?.uid || 'guest';
    if (isGuest) {
      const data = getLocalData();
      const newAdv = { ...adv, id: generateId(), ownerId };
      data.teamAdvances.unshift(newAdv);
      saveLocalData(data);
      setTeamAdvances([...data.teamAdvances]);
    } else {
      await addDoc(collection(db, 'teamAdvances'), { ...adv, ownerId });
    }
  };

  const handleDeleteTeamRecord = async (id: string, type: 'work' | 'advance') => {
    if (isGuest) {
      const data = getLocalData();
      if (type === 'work') data.teamWorkLogs = data.teamWorkLogs.filter(l => l.id !== id);
      else data.teamAdvances = data.teamAdvances.filter(a => a.id !== id);
      saveLocalData(data);
      setTeamWorkLogs([...data.teamWorkLogs]);
      setTeamAdvances([...data.teamAdvances]);
    } else {
      await deleteDoc(doc(db, type === 'work' ? 'teamWorkLogs' : 'teamAdvances', id));
    }
  };

  const handleImport = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.employees || data.workLogs || data.advances || data.teams) {
        if (isGuest) {
          const importData = {
            employees: data.employees || [],
            workLogs: data.workLogs || [],
            advances: data.advances || [],
            teams: data.teams || [],
            teamWorkLogs: data.teamWorkLogs || [],
            teamAdvances: data.teamAdvances || [],
            settings: data.settings || { standardHoursPerDay: 8 },
            projects: data.projects || []
          };
          saveLocalData(importData);
          setEmployees(importData.employees);
          setWorkLogs(importData.workLogs);
          setAdvances(importData.advances);
          setTeams(importData.teams);
          setTeamWorkLogs(importData.teamWorkLogs);
          setTeamAdvances(importData.teamAdvances);
          setSettings(importData.settings);
          setProjects(importData.projects);
          alert('导入成功！');
        } else {
          alert('请在离线模式下使用导入功能，或联系管理员同步数据。');
        }
      } else {
        alert('文件格式不正确，未找到有效数据。');
      }
    } catch (e) {
      alert('导入失败，请检查文件格式。');
    }
  };

  const handleExport = () => {
    const data = isGuest ? getLocalData() : { employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, settings, projects };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `工友记备份_${format(new Date(), 'yyyyMMdd')}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5A5A40]"></div>
      </div>
    );
  }

  if (isLocked && settings.appPassword) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-black/5 border border-white"
        >
          <div className="w-20 h-20 bg-[#5A5A40] rounded-[28px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#5A5A40]/20">
            <Info className="text-white w-10 h-10" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-2">请输入访问密码</h1>
          <p className="text-[#5A5A40]/50 mb-8 text-sm">为了您的数据安全，请输入密码进入</p>
          <input 
            type="password" 
            placeholder="输入密码" 
            value={passwordInput}
            onChange={e => { setPasswordInput(e.target.value); setPasswordError(false); }}
            autoComplete="off"
            data-lpignore="true"
            className={cn(
              "w-full bg-[#F5F5F0] rounded-2xl px-6 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all mb-2 text-center text-xl tracking-widest",
              passwordError && "ring-2 ring-red-400 bg-red-50/50"
            )}
          />
          <AnimatePresence>
            {passwordError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 justify-center text-red-500 text-sm mb-4"
              >
                <AlertCircle className="w-4 h-4" />
                <span>密码错误，请重新输入</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => {
              if (passwordInput === settings.appPassword) {
                setIsLocked(false);
                setPasswordInput('');
              } else {
                setPasswordError(true);
              }
            }}
            className="w-full bg-[#5A5A40] text-white rounded-2xl py-4 font-bold hover:bg-[#4A4A30] transition-all shadow-md mt-4"
          >
            进入系统
          </button>
        </motion.div>
      </div>
    );
  }

  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-[40px] p-12 shadow-2xl shadow-black/5 border border-white"
        >
          <div className="w-24 h-24 bg-[#5A5A40] rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#5A5A40]/20">
            <Calendar className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#1A1A1A] mb-4">工友记</h1>
          <p className="text-[#5A5A40]/70 mb-10 leading-relaxed">
            专业的记工天、记借支管理工具。<br />
            支持云端同步与本地备份。</p>
          <div className="space-y-4">
            <button 
              onClick={login}
              className="w-full bg-[#5A5A40] text-white rounded-2xl py-4 font-bold hover:bg-[#4A4A30] transition-all flex items-center justify-center gap-3 shadow-md"
            >
              <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
              使用 Google 登录
            </button>
            <button 
              onClick={continueAsGuest}
              className="w-full bg-white text-[#5A5A40] border-2 border-[#5A5A40]/10 rounded-2xl py-4 font-bold hover:bg-[#5A5A40]/5 transition-all flex items-center justify-center gap-3"
            >
              <Users className="w-5 h-5" />
              直接开始使用(本地模式)
            </button>
          </div>
          <p className="mt-8 text-xs text-[#5A5A40]/40">
            本地模式数据存储在浏览器中，建议定期备份。          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] pb-24">
      <header className="bg-white/80 backdrop-blur-md border-b border-black/5 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => { setActiveTab(Tab.Employees); setEmployeeResetKey(k => k + 1); }}
          >
            <div className="w-10 h-10 bg-[#5A5A40] rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-serif font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors">工友记</h1>
            {isGuest && (
              <span className="bg-[#5A5A40]/10 text-[#5A5A40] text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">本地</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab(Tab.Settings)}
              className={cn("p-2 rounded-xl transition-colors", activeTab === Tab.Settings ? "bg-[#5A5A40]/10 text-[#5A5A40]" : "text-[#5A5A40]/40 hover:text-[#5A5A40]")}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === Tab.Employees && (
            <EmployeeList 
              employees={employees} 
              workLogs={workLogs}
              advances={advances}
              onAdd={handleAddEmployee}
              onDelete={handleDeleteEmployee}
              onUpdateAvatar={handleUpdateEmployeeAvatar}
              onUpdateEmployee={handleUpdateEmployee}
              resetTrigger={employeeResetKey}
              onRecord={(id) => {
                setSelectedEmployeeForRecord(id);
                setActiveTab(Tab.Records);
              }}
              onShowDeleteConfirm={setShowDeleteConfirm}
            />
          )}
          {activeTab === Tab.Teams && (
            <TeamManagement 
              teams={teams}
              teamWorkLogs={teamWorkLogs}
              teamAdvances={teamAdvances}
              onAdd={handleAddTeam}
              onDelete={handleDeleteTeam}
              onUpdateTeam={handleUpdateTeam}
              onShowDeleteConfirm={setShowDeleteConfirm}
              onViewDetail={(id) => {
                setSelectedTeamForDetail(id);
                setActiveTab(Tab.TeamDetail);
              }}
            />
          )}
          {activeTab === Tab.TeamDetail && selectedTeamForDetail && (
            <TeamDetailView 
              team={teams.find(t => t.id === selectedTeamForDetail)!}
              teamWorkLogs={teamWorkLogs.filter(l => l.teamId === selectedTeamForDetail)}
              teamAdvances={teamAdvances.filter(a => a.teamId === selectedTeamForDetail)}
              onBack={() => setActiveTab(Tab.Teams)}
              onAddWorkLog={handleAddTeamWorkLog}
              onAddAdvance={handleAddTeamAdvance}
              onDeleteRecord={handleDeleteTeamRecord}
              onUpdateTeam={handleUpdateTeam}
              savedProjects={projects}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
          {activeTab === Tab.Records && (
            <RecordManager 
              employees={employees} 
              workLogs={workLogs} 
              advances={advances} 
              onAddWork={handleAddWorkLog}
              onAddAdvance={handleAddAdvance}
              onDelete={handleDeleteRecord}
              initialEmployeeId={selectedEmployeeForRecord}
              onClearInitial={() => setSelectedEmployeeForRecord(null)}
              standardHours={settings.standardHoursPerDay}
              savedProjects={projects}
              onAddProject={handleAddProject}
              onDeleteProject={handleDeleteProject}
            />
          )}
          {activeTab === Tab.Summary && (
            <SummaryView 
              employees={employees} 
              workLogs={workLogs} 
              advances={advances}
              teams={teams}
              teamWorkLogs={teamWorkLogs}
              teamAdvances={teamAdvances}
              onViewStatement={(id) => {
                setSelectedEmployeeForStatement(id);
                setActiveTab(Tab.Statement);
              }}
            />
          )}
          {activeTab === Tab.Statement && selectedEmployeeForStatement && (() => {
            const emp = employees.find(e => e.id === selectedEmployeeForStatement);
            if (!emp) return null;
            return (
            <StatementView 
              employee={emp}
              workLogs={workLogs.filter(l => l.employeeId === selectedEmployeeForStatement)}
              advances={advances.filter(a => a.employeeId === selectedEmployeeForStatement)}
              onBack={() => { setActiveTab(Tab.Summary); setSelectedEmployeeForStatement(''); }}
            />
          )})()}
          {activeTab === Tab.Settings && (
            <SettingsView 
              onExport={handleExport} 
              onImport={handleImport} 
              isGuest={isGuest}
              settings={settings}
              onUpdateSettings={updateSettings}
              employees={employees}
              workLogs={workLogs}
              advances={advances}
              projects={projects}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
              >
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="text-red-500 w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">确认删除？</h3>
                <p className="text-[#5A5A40]/60 text-sm mb-6">
                  删除后相关记账记录将永久丢失。请输入 <span className="font-bold text-red-500">确定</span> 以确认删除。</p>
                <input 
                  type="text" 
                  placeholder="输入 '确定'" 
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-xl px-4 py-3 outline-none mb-6 border border-black/5"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowDeleteConfirm(null)}
                    className="flex-1 py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all"
                  >
                    取消
                  </button>
                  <button 
                    disabled={deleteConfirmText !== '确定'}
                    onClick={() => {
                      if (teams.find(t => t.id === showDeleteConfirm)) {
                        handleDeleteTeam(showDeleteConfirm);
                      } else {
                        handleDeleteEmployee(showDeleteConfirm);
                      }
                    }}
                    className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    确认删除
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showExitBackup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-[32px] p-8 max-w-sm w-full shadow-2xl"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Download className="text-emerald-600 w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1A1A1A] mb-2 text-center">退出前备份数据</h3>
                <p className="text-[#5A5A40]/60 text-sm mb-8 text-center">
                  建议在退出前导出一份备份，防止数据丢失。                </p>
                <div className="space-y-3">
                  <button 
                    onClick={handleExitBackup}
                    disabled={isBackingUp}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {isBackingUp ? '正在备份...' : '备份并退出'}
                  </button>
                  <button 
                    onClick={handleExitNoBackup}
                    className="w-full py-3 rounded-xl font-bold text-[#5A5A40]/60 hover:bg-[#F5F5F0] transition-all"
                  >
                    直接退出                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-black/5 rounded-full px-4 py-2 shadow-2xl shadow-black/10 flex items-center gap-2 z-20">
        <NavButton 
          active={activeTab === Tab.Employees} 
          onClick={() => setActiveTab(Tab.Employees)}
          icon={<Users className="w-5 h-5" />}
          label="工友"
        />
        <NavButton 
          active={activeTab === Tab.Teams} 
          onClick={() => setActiveTab(Tab.Teams)}
          icon={<UserCog className="w-5 h-5" />}
          label="班组"
        />
        <NavButton 
          active={activeTab === Tab.Summary} 
          onClick={() => setActiveTab(Tab.Summary)}
          icon={<BarChart3 className="w-5 h-5" />}
          label="统计"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
        active ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/60 hover:bg-[#5A5A40]/5"
      )}
    >
      {icon}
      <span className={cn("text-sm font-medium overflow-hidden transition-all", active ? "w-auto opacity-100" : "w-0 opacity-0")}>{label}</span>
    </button>
  );
}

function EmployeeList({ employees, workLogs, advances, onAdd, onDelete, onUpdateAvatar, onUpdateEmployee, resetTrigger, onRecord, onShowDeleteConfirm }: { 
  employees: Employee[], 
  workLogs: WorkLog[],
  advances: Advance[],
  onAdd: (name: string, phone: string, dailyWage?: number, hoursPerDay?: number, avatar?: string) => Promise<void> | void,
  onDelete: (id: string) => Promise<void> | void,
  onUpdateAvatar: (id: string, avatar: string) => Promise<void> | void,
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => Promise<void> | void,
  resetTrigger: number,
  onRecord: (id: string) => void,
  onShowDeleteConfirm: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWage, setEditWage] = useState('');
  const [editHoursPerDay, setEditHoursPerDay] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWage, setNewWage] = useState('');
  const [newHoursPerDay, setNewHoursPerDay] = useState('8');
  const [newAvatar, setNewAvatar] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'newEmp' | string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setIsAdding(false);
    setEditingId(null);
  }, [resetTrigger]);

  const filteredEmployees = employees.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) || 
    e.phone?.includes(search)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAdd(newName, newPhone, newWage ? parseFloat(newWage) : undefined, newHoursPerDay ? parseFloat(newHoursPerDay) : undefined, newAvatar || undefined);
    setNewName('');
    setNewPhone('');
    setNewWage('');
    setNewHoursPerDay('8');
    setNewAvatar('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1A1A1A]">工友管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/40" />
            <input 
              type="text" 
              placeholder="搜索姓名或电话..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border border-black/5 focus:ring-2 ring-[#5A5A40]/10 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#5A5A40]/20 active:scale-95"
          >
            <Plus className={cn("w-6 h-6 transition-transform duration-300", isAdding && "rotate-45")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-[32px] p-8 border border-black/5 overflow-hidden shadow-xl shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#5A5A40]/10 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#5A5A40]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">添加新工友</h3>
            </div>
            <div className="flex justify-center mb-6">
              <label className="relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCropImage(ev.target?.result as string);
                      setCropTarget('newEmp');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {newAvatar ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/10 group-hover:shadow-xl transition-all">
                    <img src={newAvatar} alt="头像预览" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#F5F5F0] rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#5A5A40]/20 group-hover:border-[#5A5A40]/40 transition-all">
                    <Camera className="w-5 h-5 text-[#5A5A40]/30" />
                    <span className="text-[9px] text-[#5A5A40]/30 font-medium">上传头像</span>
                  </div>
                )}
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">姓名</label>
                <ImeInput 
                  placeholder="输入工友姓名" 
                  value={newName}
                  onChange={setNewName}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">联系电话</label>
                <ImeInput 
                  type="tel"
                  placeholder="输入联系电话" 
                  value={newPhone}
                  onChange={setNewPhone}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">工费 (元)</label>
                <input 
                  type="number" 
                  placeholder="输入工费" 
                  value={newWage}
                  onChange={e => setNewWage(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">小时/天</label>
                <input 
                  type="number" 
                  placeholder="8" 
                  value={newHoursPerDay}
                  onChange={e => setNewHoursPerDay(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98]">
              确认添加
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredEmployees.length === 0 ? (
          <div className="col-span-full bg-white/40 border-2 border-dashed border-[#5A5A40]/10 rounded-[40px] py-20 flex flex-col items-center justify-center text-[#5A5A40]/40">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">{search ? '没有找到匹配的工友' : '还没有添加工友，点击右上角加号开始吧'}</p>
          </div>
        ) : (
          filteredEmployees.map(emp => (
            <motion.div 
              layout
              key={emp.id} 
              className="bg-white rounded-[32px] p-4 border border-black/5 flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer relative"
              onClick={() => editingId !== emp.id && onRecord(emp.id)}
            >
              <div className="absolute top-3 right-3 flex gap-1 z-10">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (editingId === emp.id) {
                      setEditingId(null);
                    } else {
                      setEditingId(emp.id);
                      setEditWage(emp.dailyWage?.toString() || '');
                      setEditHoursPerDay(emp.hoursPerDay?.toString() || '');
                      setEditPhone(emp.phone || '');
                    }
                  }}
                  className="p-2 text-[#5A5A40]/20 hover:text-[#5A5A40] hover:bg-[#5A5A40]/5 rounded-xl transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDeleteConfirm(emp.id);
                  }}
                  className="p-2 text-red-500/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {editingId === emp.id ? (
                <div className="space-y-2 mt-6" onClick={e => e.stopPropagation()}>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">电话</label>
                    <input 
                      type="tel"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工费 (元)</label>
                    <input 
                      type="number"
                      value={editWage}
                      onChange={e => setEditWage(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">小时/天</label>
                    <input 
                      type="number"
                      value={editHoursPerDay}
                      onChange={e => setEditHoursPerDay(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-lg px-3 py-1.5 outline-none focus:ring-2 ring-[#5A5A40]/10 text-xs mt-0.5"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const updates: Partial<Employee> = {};
                      if (editPhone !== (emp.phone || '')) updates.phone = editPhone;
                      if (editWage && editWage !== (emp.dailyWage?.toString() || '')) updates.dailyWage = parseFloat(editWage);
                      if (editHoursPerDay && editHoursPerDay !== (emp.hoursPerDay?.toString() || '')) updates.hoursPerDay = parseFloat(editHoursPerDay);
                      if (Object.keys(updates).length > 0) onUpdateEmployee(emp.id, updates);
                      setEditingId(null);
                    }}
                    className="w-full bg-[#5A5A40] text-white py-1.5 rounded-lg font-bold text-[10px] hover:bg-[#4A4A30] transition-all"
                  >
                    保存修改
                  </button>
                </div>
              ) : (
              <>
              <div className="flex flex-col items-center text-center gap-3 mt-2">
                <label className="relative cursor-pointer group/avatar" onClick={e => e.stopPropagation()}>
                  <input 
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCropImage(ev.target?.result as string);
                        setCropTarget(emp.id);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {emp.avatar ? (
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner relative">
                      <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 transition-all flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-inner relative">
                      {emp.name[0]}
                      <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                        <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                      </div>
                    </div>
                  )}
                </label>
                <div>
                  <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors line-clamp-1">{emp.name}</h3>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Phone className="w-2.5 h-2.5 text-[#5A5A40]/40" />
                    <p className="text-[10px] text-[#5A5A40]/40 font-mono">{emp.phone || '无电话'}</p>
                  </div>
                  {emp.dailyWage && (
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-2 inline-block">
                      ¥{emp.dailyWage}/天                    </p>
                  )}
                  {emp.hoursPerDay && (
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                      {emp.hoursPerDay}小时/天                    </p>
                  )}
                </div>
                <div className="w-full mt-2 pt-2 border-t border-black/5">
                  {(() => {
                    const empWorkDays = workLogs.filter(l => l.employeeId === emp.id).reduce((acc, l) => acc + l.workDayValue, 0);
                    const empAdvances = advances.filter(a => a.employeeId === emp.id).reduce((acc, a) => acc + a.amount, 0);
                    const empBalance = (emp.dailyWage || 0) * empWorkDays - empAdvances;
                    return (
                      <div className="grid grid-cols-3 gap-1">
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">工天</p>
                          <p className="text-[10px] font-serif font-bold text-[#1A1A1A]">{formatWorkDays(empWorkDays)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">借支</p>
                          <p className="text-[10px] font-serif font-bold text-orange-600">¥{empAdvances.toLocaleString()}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">余额</p>
                          <p className="text-[10px] font-serif font-bold text-emerald-600">¥{empBalance.toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              
              <div className="mt-2 pt-2 border-t border-black/5 flex justify-center">
                <div className="w-7 h-7 rounded-full bg-[#5A5A40]/5 flex items-center justify-center text-[#5A5A40] group-hover:bg-[#5A5A40] group-hover:text-white transition-all">
                  <Plus className="w-3.5 h-3.5" />
                </div>
              </div>
              </>
              )}
            </motion.div>
          ))
        )}
      </div>
      {cropImage && (
        <AvatarCropper
          imageSrc={cropImage}
          onCrop={(result) => {
            if (cropTarget === 'newEmp') {
              setNewAvatar(result);
            } else if (cropTarget) {
              onUpdateAvatar(cropTarget, result);
            }
            setCropImage(null);
            setCropTarget(null);
          }}
          onCancel={() => { setCropImage(null); setCropTarget(null); }}
        />
      )}
    </motion.div>
  );
}

function TeamManagement({ 
  teams, 
  teamWorkLogs, 
  teamAdvances,
  onAdd, 
  onDelete, 
  onUpdateTeam,
  onShowDeleteConfirm,
  onViewDetail 
}: { 
  teams: Team[], 
  teamWorkLogs: TeamWorkLog[],
  teamAdvances: TeamAdvance[],
  onAdd: (name: string, mode: TeamMode, hoursPerDay?: number, dailyWage?: number, avatar?: string, members?: TeamMember[]) => Promise<void> | void,
  onDelete: (id: string) => Promise<void> | void,
  onUpdateTeam: (id: string, updates: Partial<Team>) => Promise<void> | void,
  onShowDeleteConfirm: (id: string) => void,
  onViewDetail: (id: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMode, setNewMode] = useState<TeamMode>('leader');
  const [newHoursPerDay, setNewHoursPerDay] = useState('8');
  const [newWage, setNewWage] = useState('');
  const [newAvatar, setNewAvatar] = useState('');
  const [newMembers, setNewMembers] = useState<TeamMember[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [search, setSearch] = useState('');
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropTarget, setCropTarget] = useState<'newTeam' | string | null>(null);

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const members = newMode === 'employee' ? newMembers : undefined;
    onAdd(newName, newMode, newHoursPerDay ? parseFloat(newHoursPerDay) : undefined, newWage ? parseFloat(newWage) : undefined, newAvatar || undefined, members);
    setNewName('');
    setNewMode('leader');
    setNewHoursPerDay('8');
    setNewWage('');
    setNewAvatar('');
    setNewMembers([]);
    setNewMemberName('');
    setIsAdding(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-serif font-bold text-[#1A1A1A]">班组管理</h2>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A5A40]/40" />
            <input 
              type="text" 
              placeholder="搜索班组..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 text-sm outline-none border border-black/5 focus:ring-2 ring-[#5A5A40]/10 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="bg-[#5A5A40] text-white p-3 rounded-2xl hover:bg-[#4A4A30] transition-all shadow-lg shadow-[#5A5A40]/20 active:scale-95"
          >
            <Plus className={cn("w-6 h-6 transition-transform duration-300", isAdding && "rotate-45")} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form 
            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
            animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-[32px] p-8 border border-black/5 overflow-hidden shadow-xl shadow-black/5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#5A5A40]/10 rounded-lg flex items-center justify-center">
                <UserCog className="w-4 h-4 text-[#5A5A40]" />
              </div>
              <h3 className="font-bold text-[#1A1A1A]">添加新班组</h3>
            </div>
            <div className="flex justify-center mb-6">
              <label className="relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setCropImage(ev.target?.result as string);
                      setCropTarget('newTeam');
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                {newAvatar ? (
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg shadow-black/10 group-hover:shadow-xl transition-all">
                    <img src={newAvatar} alt="头像预览" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-[#F5F5F0] rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-[#5A5A40]/20 group-hover:border-[#5A5A40]/40 transition-all">
                    <Camera className="w-5 h-5 text-[#5A5A40]/30" />
                    <span className="text-[9px] text-[#5A5A40]/30 font-medium">上传头像</span>
                  </div>
                )}
              </label>
            </div>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">班组名称</label>
                <ImeInput 
                  placeholder="输入班组名称" 
                  value={newName}
                  onChange={setNewName}
                  className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">管理模式</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setNewMode('leader')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border-2",
                      newMode === 'leader' 
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20" 
                        : "bg-[#F5F5F0] text-[#5A5A40]/60 border-transparent hover:border-[#5A5A40]/20"
                    )}
                  >
                    <div className="font-bold">组长模式</div>
                    <div className="text-[10px] mt-1 opacity-70">按天记人数</div>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewMode('employee')}
                    className={cn(
                      "flex-1 py-4 rounded-2xl font-bold text-sm transition-all border-2",
                      newMode === 'employee' 
                        ? "bg-[#5A5A40] text-white border-[#5A5A40] shadow-lg shadow-[#5A5A40]/20" 
                        : "bg-[#F5F5F0] text-[#5A5A40]/60 border-transparent hover:border-[#5A5A40]/20"
                    )}
                  >
                    <div className="font-bold">员工模式</div>
                    <div className="text-[10px] mt-1 opacity-70">逐人记工天</div>
                  </button>
                </div>
              </div>
              {newMode === 'employee' && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">班组成员</label>
                  <div className="flex gap-2">
                    <ImeInput 
                      placeholder="输入成员姓名" 
                      value={newMemberName}
                      onChange={setNewMemberName}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newMemberName.trim()) {
                          e.preventDefault();
                          setNewMembers([...newMembers, { id: generateId(), name: newMemberName.trim() }]);
                          setNewMemberName('');
                        }
                      }}
                      className="flex-1 bg-[#F5F5F0] rounded-2xl px-5 py-3 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm"
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newMemberName.trim()) {
                          setNewMembers([...newMembers, { id: generateId(), name: newMemberName.trim() }]);
                          setNewMemberName('');
                        }
                      }}
                      className="bg-[#5A5A40] text-white px-4 py-3 rounded-2xl text-sm font-bold hover:bg-[#4A4A30] transition-all"
                    >
                      添加
                    </button>
                  </div>
                  {newMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newMembers.map(m => (
                        <span key={m.id} className="bg-[#5A5A40]/10 text-[#5A5A40] px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5">
                          {m.name}
                          <button 
                            type="button"
                            onClick={() => setNewMembers(newMembers.filter(nm => nm.id !== m.id))}
                            className="text-[#5A5A40]/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">小时/天</label>
                  <input 
                    type="number" 
                    placeholder="8" 
                    value={newHoursPerDay}
                    onChange={e => setNewHoursPerDay(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#5A5A40]/40 uppercase ml-1">工费 (元)</label>
                  <input 
                    type="number" 
                    placeholder="输入工费" 
                    value={newWage}
                    onChange={e => setNewWage(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-4 rounded-2xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98]">
              确认添加
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredTeams.length === 0 ? (
          <div className="col-span-full bg-white/40 border-2 border-dashed border-[#5A5A40]/10 rounded-[40px] py-20 flex flex-col items-center justify-center text-[#5A5A40]/40">
            <UserCog className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium">{search ? '没有找到匹配的班组' : '还没有添加班组，点击右上角加号开始吧'}</p>
          </div>
        ) : (
          filteredTeams.map(team => {
            const teamLogs = teamWorkLogs.filter(l => l.teamId === team.id);
            const teamAdvs = teamAdvances.filter(a => a.teamId === team.id);
            const totalWorkDays = teamLogs.reduce((sum, l) => sum + l.workerCount, 0);
            const totalAdvances = teamAdvs.reduce((sum, a) => sum + a.amount, 0);
            const balance = (team.dailyWage || 0) * totalWorkDays - totalAdvances;
            return (
              <motion.div 
                layout
                key={team.id} 
                className="bg-white rounded-[32px] p-4 border border-black/5 flex flex-col group hover:shadow-xl hover:shadow-black/5 transition-all cursor-pointer relative"
                onClick={() => onViewDetail(team.id)}
              >
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowDeleteConfirm(team.id);
                  }}
                  className="absolute top-3 right-3 p-2 text-red-500/20 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="flex flex-col items-center text-center gap-3 mt-2">
                  <label className="relative cursor-pointer group/avatar" onClick={e => e.stopPropagation()}>
                    <input 
                      type="file" 
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setCropImage(ev.target?.result as string);
                          setCropTarget(team.id);
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {team.avatar ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-inner relative">
                        <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-inner relative">
                        {team.name[0]}
                        <div className="absolute inset-0 bg-black/0 group-hover/avatar:bg-black/30 rounded-2xl transition-all flex items-center justify-center">
                          <Camera className="w-4 h-4 text-white opacity-0 group-hover/avatar:opacity-100 transition-all" />
                        </div>
                      </div>
                    )}
                  </label>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] group-hover:text-[#5A5A40] transition-colors line-clamp-1">{team.name}</h3>
                    <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-2 inline-block">
                      {team.mode === 'leader' ? '组长模式' : '员工模式'}
                    </p>
                    {team.dailyWage && (
                      <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                        ¥{team.dailyWage}/天                      </p>
                    )}
                    {team.hoursPerDay && (
                      <p className="text-[10px] bg-[#5A5A40]/5 text-[#5A5A40] px-2 py-0.5 rounded-full mt-1 inline-block">
                        {team.hoursPerDay}小时/天                      </p>
                    )}
                  </div>
                </div>
                
                <div className="w-full mt-2 pt-2 border-t border-black/5">
                  <div className="grid grid-cols-3 gap-1">
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">工天</p>
                      <p className="text-[10px] font-serif font-bold text-[#1A1A1A]">{formatWorkDays(totalWorkDays)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">借支</p>
                      <p className="text-[10px] font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[7px] text-[#5A5A40]/40 font-bold uppercase">余额</p>
                      <p className="text-[10px] font-serif font-bold text-emerald-600">¥{balance.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      {cropImage && (
        <AvatarCropper
          imageSrc={cropImage}
          onCrop={(result) => {
            if (cropTarget === 'newTeam') {
              setNewAvatar(result);
            } else if (cropTarget) {
              onUpdateTeam(cropTarget, { avatar: result });
            }
            setCropImage(null);
            setCropTarget(null);
          }}
          onCancel={() => { setCropImage(null); setCropTarget(null); }}
        />
      )}
    </motion.div>
  );
}

function TeamDetailView({ 
  team, 
  teamWorkLogs, 
  teamAdvances, 
  onBack, 
  onAddWorkLog, 
  onAddAdvance, 
  onDeleteRecord,
  onUpdateTeam,
  savedProjects,
  onAddProject,
  onDeleteProject
}: { 
  team: Team, 
  teamWorkLogs: TeamWorkLog[], 
  teamAdvances: TeamAdvance[], 
  onBack: () => void,
  onAddWorkLog: (log: Omit<TeamWorkLog, 'id' | 'ownerId'>) => Promise<void> | void,
  onAddAdvance: (adv: Omit<TeamAdvance, 'id' | 'ownerId'>) => Promise<void> | void,
  onDeleteRecord: (id: string, type: 'work' | 'advance') => Promise<void> | void,
  onUpdateTeam: (id: string, updates: Partial<Team>) => Promise<void> | void,
  savedProjects: string[],
  onAddProject: (name: string) => void,
  onDeleteProject: (name: string) => void
}) {
  const [type, setType] = useState<'work' | 'advance'>('work');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [workerCount, setWorkerCount] = useState('1');
  const [selectedMember, setSelectedMember] = useState('');
  const [hours, setHours] = useState('');
  const [amount, setAmount] = useState('');
  const [project, setProject] = useState('');
  const [desc, setDesc] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [showMemberManager, setShowMemberManager] = useState(false);

  const isLeaderMode = team.mode === 'leader';
  const hoursPerDay = team.hoursPerDay || 8;
  const members = team.members || [];

  const totalWorkDays = teamWorkLogs.reduce((sum, l) => sum + l.workerCount, 0);
  const totalAdvances = teamAdvances.reduce((sum, a) => sum + a.amount, 0);
  const estimatedWage = team.dailyWage ? (totalWorkDays * team.dailyWage) : 0;
  const balance = estimatedWage - totalAdvances;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'work') {
      if (isLeaderMode) {
        const wc = parseInt(workerCount) || 0;
        if (!wc) return;
        onAddWorkLog({
          teamId: team.id,
          date,
          workerCount: wc,
          project,
          description: desc
        });
        setWorkerCount('1');
      } else {
        const h = parseFloat(hours) || 0;
        if (!h || !selectedMember || !hoursPerDay) return;
        const member = members.find(m => m.id === selectedMember);
        onAddWorkLog({
          teamId: team.id,
          date,
          workerCount: h / hoursPerDay,
          memberId: selectedMember,
          memberName: member?.name,
          hours: h,
          project,
          description: desc
        });
        setHours('');
        setSelectedMember('');
      }
    } else {
      const a = parseFloat(amount) || 0;
      if (!a) return;
      onAddAdvance({
        teamId: team.id,
        date,
        amount: a,
        description: desc
      });
      setAmount('');
    }
    setDesc('');
    setProject('');
  };

  const sortedWorkLogs = [...teamWorkLogs].sort((a, b) => b.date.localeCompare(a.date));
  const sortedAdvances = [...teamAdvances].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-black/5 text-[#5A5A40] hover:bg-[#F5F5F0] transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        {team.avatar ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden shadow-inner">
            <img src={team.avatar} alt={team.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm shadow-inner">
            {team.name[0]}
          </div>
        )}
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">{team.name}</h2>
          <p className="text-[10px] text-[#5A5A40]/40">{isLeaderMode ? '组长模式 · 按天记人数' : '员工模式 · 逐人记工天'}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计工天</p>
          <p className="text-xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(totalWorkDays)} <span className="text-[10px] font-sans opacity-40">个工</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计借支</p>
          <p className="text-xl font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</p>
        </div>
        <div className="bg-[#5A5A40] rounded-2xl p-4 shadow-lg shadow-[#5A5A40]/20 text-white">
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-1">应结余额</p>
          <p className="text-xl font-serif font-bold">¥{balance.toLocaleString()}</p>
        </div>
      </div>

      {!isLeaderMode && (
        <div className="bg-white rounded-2xl p-4 border border-black/5 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-[#1A1A1A] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#5A5A40]" />
              成员 ({members.length}人)
            </h3>
            <button 
              onClick={() => setShowMemberManager(!showMemberManager)}
              className="text-[10px] font-bold text-[#5A5A40]/60 hover:text-[#5A5A40] transition-colors"
            >
              {showMemberManager ? '收起' : '管理'}
            </button>
          </div>
          {members.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {members.map(m => (
                <span key={m.id} className="bg-[#5A5A40]/10 text-[#5A5A40] px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1">
                  {m.name}
                  {showMemberManager && (
                    <button 
                      onClick={() => onUpdateTeam(team.id, { members: members.filter(nm => nm.id !== m.id) })}
                      className="text-[#5A5A40]/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          {members.length === 0 && <p className="text-[10px] text-[#5A5A40]/40 mb-2">暂无成员，请添加</p>}
          {showMemberManager && (
            <div className="flex gap-2">
              <ImeInput 
                placeholder="输入成员姓名" 
                value={newMemberName}
                onChange={setNewMemberName}
                onKeyDown={e => {
                  if (e.key === 'Enter' && newMemberName.trim()) {
                    e.preventDefault();
                    onUpdateTeam(team.id, { members: [...members, { id: generateId(), name: newMemberName.trim() }] });
                    setNewMemberName('');
                  }
                }}
                className="flex-1 bg-[#F5F5F0] rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-xs"
              />
              <button 
                onClick={() => {
                  if (newMemberName.trim()) {
                    onUpdateTeam(team.id, { members: [...members, { id: generateId(), name: newMemberName.trim() }] });
                    setNewMemberName('');
                  }
                }}
                className="bg-[#5A5A40] text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-[#4A4A30] transition-all"
              >
                添加
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-4" style={{height: 'calc(100vh - 380px)', minHeight: '300px'}}>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex bg-[#F5F5F0] p-1 rounded-lg m-3 mb-0">
            <button 
              onClick={() => setType('work')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'work' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Clock className="w-3.5 h-3.5" />
              记工天            </button>
            <button 
              onClick={() => setType('advance')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'advance' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Wallet className="w-3.5 h-3.5" />
              记借支
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3">
            {type === 'work' && isLeaderMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">日期</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">出工人数 (个工)</label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input type="number" step="1" min="1" placeholder="输入人数" value={workerCount} onChange={e => setWorkerCount(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-20 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button type="button" onClick={() => setWorkerCount('1')} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5">1</button>
                      <button type="button" onClick={() => setWorkerCount('5')} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5">5</button>
                      <button type="button" onClick={() => setWorkerCount('10')} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5">10</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : type === 'work' && !isLeaderMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">日期</label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                      <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">选择成员</label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                      <select value={selectedMember} onChange={e => setSelectedMember(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none appearance-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required>
                        <option value="">选择成员</option>
                        {members.map(m => (<option key={m.id} value={m.id}>{m.name}</option>))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工时 ({hoursPerDay}小时=1个工)</label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input type="number" step="0.1" min="0" placeholder="输入工时" value={hours} onChange={e => setHours(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-20 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button type="button" onClick={() => setHours(hoursPerDay.toString())} className="text-[10px] bg-white px-2 py-1 rounded-lg border border-black/5 font-bold">全天</button>
                      <button type="button" onClick={() => setHours((hoursPerDay/2).toString())} className="text-[10px] bg-white px-2 py-1 rounded-lg border border-black/5 font-bold">半天</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">日期</label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">借支金额 (元)</label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input type="number" step="0.01" placeholder="输入金额" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all" required />
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">项目</label>
              <ImeInput 
                placeholder="输入项目名称" 
                value={project} 
                onChange={setProject}
                onKeyDown={e => {
                  if (e.key === 'Enter' && project.trim() && !savedProjects.includes(project.trim())) {
                    e.preventDefault();
                    onAddProject(project.trim());
                  }
                }}
                className="w-full bg-[#F5F5F0] rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm mt-1" 
              />
              {savedProjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {savedProjects.map(p => (
                    <div 
                      key={p} 
                      className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 group/proj",
                        project === p 
                          ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                          : "bg-white text-[#5A5A40]/60 border-black/5 hover:border-[#5A5A40]/30"
                      )}
                    >
                      <button type="button" onClick={() => setProject(p)} className="cursor-pointer">{p}</button>
                      <button type="button" onClick={() => onDeleteProject(p)} className="text-[#5A5A40]/20 hover:text-red-500 transition-colors opacity-0 group-hover/proj:opacity-100">
                        <Trash2 className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">备注</label>
              <ImeInput placeholder="可选" value={desc} onChange={setDesc} className="w-full bg-[#F5F5F0] rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm mt-1" />
            </div>
            <button type="submit" className="w-full bg-[#5A5A40] text-white py-2.5 rounded-xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98] text-sm">
              {type === 'work' ? '确认记工' : '确认借支'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-black/5 bg-[#F5F5F0]/30">
            <Clock className="w-3 h-3 text-emerald-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">上班记录</h3>
            <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{sortedWorkLogs.length}条</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedWorkLogs.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无上班记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {sortedWorkLogs.map(rec => (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {isLeaderMode ? (
                            <span className="text-[10px] font-bold text-[#5A5A40]">{rec.workerCount}人</span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#5A5A40]">{rec.memberName || '未知'}</span>
                          )}
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[#1A1A1A]">
                          {isLeaderMode
                            ? `${rec.workerCount}个工`
                            : `${rec.hours}小时 / ${formatWorkDays(rec.workerCount)}个工`}
                        </p>
                        {rec.project && <p className="text-[8px] text-[#5A5A40]/40">{rec.project}</p>}
                      </div>
                    </div>
                    <button onClick={() => onDeleteRecord(rec.id, 'work')} className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Wallet className="w-3 h-3 text-orange-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">借支记录</h3>
            <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{sortedAdvances.length}条</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sortedAdvances.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无借支记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {sortedAdvances.map(rec => (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Wallet className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#5A5A40]">{team.name}</span>
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-bold text-orange-600">¥{rec.amount}</p>
                        {rec.description && <p className="text-[8px] text-[#5A5A40]/40">{rec.description}</p>}
                      </div>
                    </div>
                    <button onClick={() => onDeleteRecord(rec.id, 'advance')} className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all">
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function RecordManager({ 
  employees, 
  workLogs, 
  advances, 
  onAddWork, 
  onAddAdvance, 
  onDelete,
  initialEmployeeId,
  onClearInitial,
  standardHours,
  savedProjects,
  onAddProject,
  onDeleteProject
}: { 
  employees: Employee[], 
  workLogs: WorkLog[], 
  advances: Advance[], 
  onAddWork: (log: Omit<WorkLog, 'id' | 'ownerId'>) => Promise<void> | void,
  onAddAdvance: (adv: Omit<Advance, 'id' | 'ownerId'>) => Promise<void> | void,
  onDelete: (id: string, type: 'work' | 'advance') => Promise<void> | void,
  initialEmployeeId: string | null,
  onClearInitial: () => void,
  standardHours: number,
  savedProjects: string[],
  onAddProject: (name: string) => void,
  onDeleteProject: (name: string) => void
}) {
  const [type, setType] = useState<'work' | 'advance'>('work');
  const [selectedEmp, setSelectedEmp] = useState(initialEmployeeId || '');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState(standardHours.toString());
  const [project, setProject] = useState('');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');

  const currentEmpHoursPerDay = selectedEmp ? (employees.find(e => e.id === selectedEmp)?.hoursPerDay || standardHours) : standardHours;

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmp(initialEmployeeId);
      onClearInitial();
    }
  }, [initialEmployeeId, onClearInitial]);

  useEffect(() => {
    setHours(currentEmpHoursPerDay.toString());
  }, [currentEmpHoursPerDay]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (type === 'work') {
      const h = parseFloat(hours) || 0;
      if (!h || !currentEmpHoursPerDay) return;
      onAddWork({
        employeeId: selectedEmp,
        date,
        hours: h,
        workDayValue: h / currentEmpHoursPerDay,
        project,
        description: desc
      });
    } else {
      const a = parseFloat(amount) || 0;
      if (!a) return;
      onAddAdvance({
        employeeId: selectedEmp,
        date,
        amount: a,
        description: desc
      });
    }
    setAmount('');
    setDesc('');
    setProject('');
  };

  const filteredWorkLogs = selectedEmp
    ? workLogs.filter(l => l.employeeId === selectedEmp).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const filteredAdvances = selectedEmp
    ? advances.filter(a => a.employeeId === selectedEmp).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-2xl font-serif font-bold text-[#1A1A1A] mb-3">记一笔</h2>
      
      {selectedEmp && (() => {
        const emp = employees.find(e => e.id === selectedEmp);
        const empWorkDays = filteredWorkLogs.reduce((acc, l) => acc + l.workDayValue, 0);
        const empAdvances = filteredAdvances.reduce((acc, a) => acc + a.amount, 0);
        const empBalance = (emp?.dailyWage || 0) * empWorkDays - empAdvances;
        return (
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-white rounded-xl p-2.5 border border-black/5">
              <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">累计工天</p>
              <p className="text-lg font-serif font-bold text-[#1A1A1A]">{formatWorkDays(empWorkDays)} <span className="text-[8px] font-sans opacity-40">个工</span></p>
            </div>
            <div className="bg-white rounded-xl p-2.5 border border-black/5">
              <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">累计借支</p>
              <p className="text-lg font-serif font-bold text-orange-600">¥{empAdvances.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-600 rounded-xl p-2.5 shadow-lg shadow-emerald-600/20 text-white">
              <p className="text-[8px] font-bold opacity-70 uppercase tracking-widest">应结余额</p>
              <p className="text-lg font-serif font-bold">¥{empBalance.toLocaleString()}</p>
              {emp?.dailyWage && <p className="text-[7px] opacity-50">¥{emp.dailyWage}/天</p>}
            </div>
          </div>
        );
      })()}
      
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-3" style={{height: selectedEmp ? 'calc(100vh - 280px)' : 'calc(100vh - 160px)'}}>
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/5 shadow-xl shadow-black/5 flex flex-col overflow-hidden">
          <div className="flex bg-[#F5F5F0] p-1 rounded-lg m-3 mb-0">
            <button 
              onClick={() => setType('work')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'work' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Clock className="w-3 h-3" />
              记工天            </button>
            <button 
              onClick={() => setType('advance')}
              className={cn("flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs", type === 'advance' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#5A5A40]/40 hover:text-[#5A5A40]/60")}
            >
              <Wallet className="w-3 h-3" />
              记借支
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {selectedEmp ? (
              <div className="flex items-center gap-2 bg-[#F5F5F0] rounded-lg px-3 py-2">
                {(() => {
                  const emp = employees.find(e => e.id === selectedEmp);
                  return emp ? (
                    <>
                      {emp.avatar ? (
                        <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-7 h-7 bg-[#5A5A40] rounded-lg flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
                          {emp.name[0]}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-[10px] text-[#1A1A1A] truncate">{emp.name}</p>
                        <div className="flex items-center gap-2">
                          {emp.phone && (
                            <span className="text-[8px] text-[#5A5A40]/40 font-mono">{emp.phone}</span>
                          )}
                          {emp.dailyWage && (
                            <span className="text-[8px] text-[#5A5A40]/60">¥{emp.dailyWage}/</span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="bg-[#F5F5F0] rounded-lg px-3 py-2 text-center">
                <p className="text-[10px] text-[#5A5A40]/40">请从工友管理中选择工友</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">日期</label>
              <div className="relative mt-0.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  required
                />
              </div>
            </div>
            {type === 'work' ? (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工时 ({currentEmpHoursPerDay}小时=1个工)</label>
                <div className="relative mt-0.5">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-20 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                    <button type="button" onClick={() => setHours(currentEmpHoursPerDay.toString())} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5 hover:bg-white/50 font-bold">全天</button>
                    <button type="button" onClick={() => setHours((currentEmpHoursPerDay/2).toString())} className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5 hover:bg-white/50 font-bold">半天</button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">借支金额 (元)</label>
                <div className="relative mt-0.5">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <input 
                    type="number" 
                    placeholder="0.00"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                    required
                  />
                </div>
              </div>
            )}

            {type === 'work' && (
              <div>
                <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">工地项目</label>
                <div className="relative mt-0.5">
                  <Info className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                  <ImeInput 
                    placeholder="输入工地/项目名称"
                    value={project}
                    onChange={setProject}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && project.trim() && !savedProjects.includes(project.trim())) {
                        e.preventDefault();
                        onAddProject(project.trim());
                      }
                    }}
                    className="w-full bg-[#F5F5F0] rounded-lg pl-9 pr-3 py-2 outline-none font-bold text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                  />
                </div>
                {savedProjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {savedProjects.map(p => (
                      <div 
                        key={p} 
                        className={cn(
                          "text-[8px] px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 group/proj",
                          project === p 
                            ? "bg-[#5A5A40] text-white border-[#5A5A40]" 
                            : "bg-white text-[#5A5A40]/60 border-black/5 hover:border-[#5A5A40]/30"
                        )}
                      >
                        <button 
                          type="button"
                          onClick={() => setProject(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDeleteProject(p); }}
                          className="text-[#5A5A40]/20 hover:text-red-500 transition-colors opacity-0 group-hover/proj:opacity-100"
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">备注 (可选)</label>
              <ImeTextarea 
                placeholder="添加一些备注..."
                value={desc}
                onChange={setDesc}
                className="w-full bg-[#F5F5F0] rounded-lg px-3 py-2 outline-none font-medium text-xs text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all resize-none"
                rows={1}
              />
            </div>

            <button type="submit" className="w-full bg-[#5A5A40] text-white py-2 rounded-lg font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98] text-xs">
              确认记录
            </button>
          </form>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Clock className="w-3 h-3 text-emerald-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">上班记录</h3>
            {selectedEmp && <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{filteredWorkLogs.length}条</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedEmp ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">请先选择工友</div>
            ) : filteredWorkLogs.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无上班记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredWorkLogs.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#5A5A40]">{emp?.name || '未知'}</span>
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[#1A1A1A]">{rec.hours}小时 / {formatWorkDays(rec.workDayValue)}个工</p>
                        {rec.project && <p className="text-[8px] text-[#5A5A40]/40">{rec.project}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(rec.id, 'work')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Wallet className="w-3 h-3 text-orange-600" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">借支记录</h3>
            {selectedEmp && <span className="text-[9px] text-[#5A5A40]/40 ml-auto">{filteredAdvances.length}条</span>}
          </div>
          <div className="flex-1 overflow-y-auto">
            {!selectedEmp ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">请先选择工友</div>
            ) : filteredAdvances.length === 0 ? (
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">暂无借支记录</div>
            ) : (
              <div className="divide-y divide-black/5">
                {filteredAdvances.map(rec => {
                  const emp = employees.find(e => e.id === rec.employeeId);
                  return (
                  <div key={rec.id} className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Wallet className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-bold text-[#5A5A40]">{emp?.name || '未知'}</span>
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-bold text-orange-600">¥{rec.amount}</p>
                        {rec.description && <p className="text-[8px] text-[#5A5A40]/40">{rec.description}</p>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onDelete(rec.id, 'advance')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SummaryView({ employees, workLogs, advances, teams, teamWorkLogs, teamAdvances, onViewStatement }: { 
  employees: Employee[], 
  workLogs: WorkLog[], 
  advances: Advance[],
  teams: Team[],
  teamWorkLogs: TeamWorkLog[],
  teamAdvances: TeamAdvance[],
  onViewStatement: (id: string) => void
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [reportMode, setReportMode] = useState<'boss' | 'worker' | 'team' | 'project'>('boss');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [timeMode, setTimeMode] = useState<'month' | 'year'>('month');
  
  const periodStart = timeMode === 'month' ? startOfMonth(currentMonth) : startOfYear(currentMonth);
  const periodEnd = timeMode === 'month' ? endOfMonth(currentMonth) : endOfYear(currentMonth);

  const filteredWorkLogs = workLogs.filter(log => 
    isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })
  );
  
  const filteredAdvances = advances.filter(adv => 
    isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })
  );

  const filteredTeamWorkLogs = teamWorkLogs.filter(log =>
    isWithinInterval(parseISO(log.date), { start: periodStart, end: periodEnd })
  );

  const filteredTeamAdvances = teamAdvances.filter(adv =>
    isWithinInterval(parseISO(adv.date), { start: periodStart, end: periodEnd })
  );

  const grandTotalWorkDays = filteredWorkLogs.reduce((acc, curr) => acc + curr.workDayValue, 0);
  const grandTotalAdvances = filteredAdvances.reduce((acc, curr) => acc + curr.amount, 0);

  const grandTotalTeamWorkDays = filteredTeamWorkLogs.reduce((acc, curr) => acc + curr.workerCount, 0);
  const grandTotalTeamAdvances = filteredTeamAdvances.reduce((acc, curr) => acc + curr.amount, 0);

  const allWorkDays = grandTotalWorkDays + grandTotalTeamWorkDays;
  const allAdvances = grandTotalAdvances + grandTotalTeamAdvances;

  const employeeSummaries = employees.map(emp => {
    const empWork = filteredWorkLogs.filter(l => l.employeeId === emp.id);
    const empAdv = filteredAdvances.filter(a => a.employeeId === emp.id);
    
    return {
      ...emp,
      totalWorkDays: empWork.reduce((acc, curr) => acc + curr.workDayValue, 0),
      totalAdvances: empAdv.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }).filter(s => s.totalWorkDays > 0 || s.totalAdvances > 0);

  const teamSummaries = teams.map(team => {
    const tWork = filteredTeamWorkLogs.filter(l => l.teamId === team.id);
    const tAdv = filteredTeamAdvances.filter(a => a.teamId === team.id);
    return {
      ...team,
      totalWorkDays: tWork.reduce((acc, curr) => acc + curr.workerCount, 0),
      totalAdvances: tAdv.reduce((acc, curr) => acc + curr.amount, 0)
    };
  }).filter(s => s.totalWorkDays > 0 || s.totalAdvances > 0);

  const projectStats: Record<string, { workDays: number, advances: number }> = {};
  
  filteredWorkLogs.forEach(log => {
    const p = log.project || '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].workDays += log.workDayValue;
  });

  filteredTeamWorkLogs.forEach(log => {
    const p = log.project || '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].workDays += log.workerCount;
  });

  filteredAdvances.forEach(adv => {
    const empWorkLogs = filteredWorkLogs.filter(l => l.employeeId === adv.employeeId);
    const empProjects = [...new Set(empWorkLogs.map(l => l.project).filter(Boolean))];
    const p = empProjects.length === 1 ? empProjects[0]! : '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].advances += adv.amount;
  });

  filteredTeamAdvances.forEach(adv => {
    const teamWorkLogsForAdv = filteredTeamWorkLogs.filter(l => l.teamId === adv.teamId);
    const teamProjects = [...new Set(teamWorkLogsForAdv.map(l => l.project).filter(Boolean))];
    const p = teamProjects.length === 1 ? teamProjects[0]! : '未分类';
    if (!projectStats[p]) projectStats[p] = { workDays: 0, advances: 0 };
    projectStats[p].advances += adv.amount;
  });

  const projectEntries = Object.entries(projectStats).sort((a, b) => b[1].workDays - a[1].workDays);
  const maxProjectWorkDays = projectEntries.length > 0 ? projectEntries[0][1].workDays : 1;

  const employeePersonShifts = filteredWorkLogs.length;
  const teamPersonShifts = filteredTeamWorkLogs.reduce((sum, log) => {
    const team = teams.find(t => t.id === log.teamId);
    if (team?.mode === 'leader') {
      return sum + log.workerCount;
    }
    return sum + 1;
  }, 0);
  const totalPersonShifts = employeePersonShifts + teamPersonShifts;

  const employeeTotalWages = employeeSummaries.reduce((sum, s) => sum + (s.dailyWage || 0) * s.totalWorkDays, 0);
  const teamTotalWages = teamSummaries.reduce((sum, s) => sum + (s.dailyWage || 0) * s.totalWorkDays, 0);
  const totalWages = employeeTotalWages + teamTotalWages;
  const totalBalance = totalWages - allAdvances;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-serif font-bold text-[#1A1A1A]">统计报表</h2>
          <div className="flex items-center gap-3 mt-1">
            <button 
              onClick={() => setReportMode('boss')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'boss' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              老板报表
            </button>
            <button 
              onClick={() => setReportMode('worker')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'worker' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              工友报表
            </button>
            <button 
              onClick={() => setReportMode('team')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'team' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              班组报表
            </button>
            <button 
              onClick={() => setReportMode('project')}
              className={cn(
                "text-[10px] font-bold transition-all pb-1 border-b-2",
                reportMode === 'project' ? "text-[#5A5A40] border-[#5A5A40]" : "text-[#5A5A40]/40 border-transparent"
              )}
            >
              工地统计
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-xl p-0.5 border border-black/5 shadow-sm">
            <button 
              onClick={() => setTimeMode('month')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                timeMode === 'month' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
              )}
            >
              月            </button>
            <button 
              onClick={() => setTimeMode('year')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                timeMode === 'year' ? "bg-[#5A5A40] text-white" : "text-[#5A5A40]/40 hover:text-[#5A5A40]"
              )}
            >
              年            </button>
          </div>
          <div className="flex items-center bg-white rounded-xl p-1 border border-black/5 shadow-sm">
            <button 
              onClick={() => {
                const d = new Date(currentMonth);
                if (timeMode === 'month') d.setMonth(d.getMonth() - 1);
                else d.setFullYear(d.getFullYear() - 1);
                setCurrentMonth(d);
              }}
              className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
            </button>
            <span className="px-3 font-bold text-[#5A5A40] text-xs min-w-[100px] text-center">
              {timeMode === 'month' ? format(currentMonth, 'yyyy年MM月') : format(currentMonth, 'yyyy年')}
            </span>
            <button 
              onClick={() => {
                const d = new Date(currentMonth);
                if (timeMode === 'month') d.setMonth(d.getMonth() + 1);
                else d.setFullYear(d.getFullYear() + 1);
                setCurrentMonth(d);
              }}
              className="p-1.5 hover:bg-[#F5F5F0] rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {reportMode === 'boss' ? (
          <motion.div 
            key="boss"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 opacity-70">
                    <BarChart3 className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{timeMode === 'month' ? '本月' : '本年'}总工天</span>
                  </div>
                  <div className="text-2xl font-serif font-bold">{formatWorkDays(allWorkDays)}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">个人{formatWorkDays(grandTotalWorkDays)} + 班组{formatWorkDays(grandTotalTeamWorkDays)}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#5A5A40]/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                    <Wallet className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">{timeMode === 'month' ? '本月' : '本年'}总借支</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A1A1A]">¥{allAdvances.toLocaleString()}</div>
                  <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">个人¥{grandTotalAdvances.toLocaleString()} + 班组¥{grandTotalTeamAdvances.toLocaleString()}</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5 relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-50 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                    <Users className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">用工量(人次)</span>
                  </div>
                  <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{totalPersonShifts}</div>
                  <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">个人{employeePersonShifts}人次 + 班组{teamPersonShifts}人次</div>
                </div>
              </div>
              <div className={cn("rounded-2xl p-4 shadow-xl relative overflow-hidden", totalBalance >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-emerald-700/20" : "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-red-600/20")}>
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-white/10 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <div className="flex items-center gap-1 mb-1 opacity-70">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">应结余额</span>
                  </div>
                  <div className="text-2xl font-serif font-bold">¥{totalBalance.toLocaleString()}</div>
                  <div className="text-[9px] opacity-60 mt-0.5">应付¥{totalWages.toLocaleString()} - 已借¥{allAdvances.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">老板概览 (全员汇总)</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">共{employeeSummaries.length} 位活跃工友</span>
              </div>
              <div className="divide-y divide-black/5">
                {employeeSummaries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无记录
                  </div>
                ) : (
                  employeeSummaries.map(summary => (
                    <div key={summary.id} className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors">
                      <div className="flex items-center gap-2.5">
                        {summary.avatar ? (
                          <div className="w-8 h-8 rounded-lg overflow-hidden">
                            <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-[#F5F5F0] rounded-lg flex items-center justify-center text-[#5A5A40] font-bold text-xs">
                            {summary.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-[10px] text-[#1A1A1A]">{summary.name}</h4>
                          <p className="text-[8px] text-[#5A5A40]/40">{summary.phone || '无电话'}</p>
                        </div>
                      </div>
                      <div className="flex gap-5 text-right items-center">
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">工天</div>
                          <div className="font-serif font-bold text-xs text-[#1A1A1A]">{formatWorkDays(summary.totalWorkDays)}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">借支</div>
                          <div className="font-serif font-bold text-xs text-orange-600">¥{summary.totalAdvances}</div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">应结</div>
                          <div className={cn("font-serif font-bold text-xs", (summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances >= 0 ? "text-emerald-600" : "text-red-500")}>¥{((summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'worker' ? (
          <motion.div 
            key="worker"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-xs text-[#1A1A1A]">工友报表 (个人对账)</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">选择工友查看详细对账单</span>
              </div>
              <div className="divide-y divide-black/5">
                {employeeSummaries.length === 0 ? (
                  <div className="p-10 text-center text-[#5A5A40]/30 text-xs font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无记录
                  </div>
                ) : (
                  employeeSummaries.map(summary => (
                    <div 
                      key={summary.id} 
                      className="px-4 py-3 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors cursor-pointer"
                      onClick={() => onViewStatement(summary.id)}
                    >
                      <div className="flex items-center gap-3">
                        {summary.avatar ? (
                          <div className="w-9 h-9 rounded-xl overflow-hidden">
                            <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 bg-[#5A5A40]/5 rounded-xl flex items-center justify-center text-[#5A5A40] font-bold text-sm">
                            {summary.name[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="font-bold text-xs text-[#1A1A1A]">{summary.name}</h4>
                          <p className="text-[9px] text-[#5A5A40]/40 font-medium">点击查看对账单</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#5A5A40]/20" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'team' ? (
          <motion.div 
            key="team"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20">
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">班组总工天</span>
                </div>
                <div className="text-2xl font-serif font-bold">{formatWorkDays(grandTotalTeamWorkDays)}</div>
                <div className="text-[9px] opacity-60 mt-0.5">{teamSummaries.length}个活跃班组</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                  <Wallet className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">班组总借支</span>
                </div>
                <div className="text-2xl font-serif font-bold text-orange-600">¥{grandTotalTeamAdvances.toLocaleString()}</div>
                <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">全部班组预支</div>
              </div>
              <div className={cn("rounded-2xl p-4 shadow-xl", teamTotalWages - grandTotalTeamAdvances >= 0 ? "bg-gradient-to-br from-emerald-700 to-emerald-600 text-white shadow-emerald-700/20" : "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-red-600/20")}>
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <DollarSign className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">应结余额</span>
                </div>
                <div className="text-2xl font-serif font-bold">¥{(teamTotalWages - grandTotalTeamAdvances).toLocaleString()}</div>
                <div className="text-[9px] opacity-60 mt-0.5">应付¥{teamTotalWages.toLocaleString()} - 已借¥{grandTotalTeamAdvances.toLocaleString()}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 flex items-center justify-between bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">班组汇总</h3>
                <span className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">共{teamSummaries.length} 个活跃班组 · 点击查看明细</span>
              </div>
              <div className="divide-y divide-black/5">
                {teamSummaries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无班组记录
                  </div>
                ) : (
                  teamSummaries.map(summary => {
                    const teamDetailWorkLogs = filteredTeamWorkLogs.filter(l => l.teamId === summary.id);
                    const teamDetailAdvances = filteredTeamAdvances.filter(a => a.teamId === summary.id);
                    const isLeaderMode = summary.mode === 'leader';
                    
                    const memberStats: Record<string, { name: string, workDays: number }> = {};
                    if (!isLeaderMode && summary.members) {
                      summary.members.forEach(m => {
                        memberStats[m.id] = { name: m.name, workDays: 0 };
                      });
                    }
                    teamDetailWorkLogs.forEach(log => {
                      if (!isLeaderMode && log.memberId) {
                        if (!memberStats[log.memberId]) memberStats[log.memberId] = { name: log.memberName || '未知', workDays: 0 };
                        memberStats[log.memberId].workDays += log.workerCount;
                      }
                    });

                    return (
                      <div key={summary.id}>
                        <div 
                          className="px-4 py-2.5 flex items-center justify-between hover:bg-[#F5F5F0]/20 transition-colors cursor-pointer"
                          onClick={() => setExpandedTeam(expandedTeam === summary.id ? null : summary.id)}
                        >
                          <div className="flex items-center gap-2.5">
                            {summary.avatar ? (
                              <div className="w-8 h-8 rounded-lg overflow-hidden">
                                <img src={summary.avatar} alt={summary.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 bg-[#5A5A40]/10 rounded-lg flex items-center justify-center text-[#5A5A40] font-bold text-xs">
                                {summary.name[0]}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-[10px] text-[#1A1A1A]">{summary.name}</h4>
                              <p className="text-[8px] text-[#5A5A40]/40">{isLeaderMode ? '组长模式' : '员工模式'}{summary.members ? ` · ${summary.members.length}人` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-5 text-right items-center">
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">工天</div>
                                <div className="font-serif font-bold text-xs text-[#1A1A1A]">{formatWorkDays(summary.totalWorkDays)}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">借支</div>
                                <div className="font-serif font-bold text-xs text-orange-600">¥{summary.totalAdvances}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-[#5A5A40]/40 uppercase mb-0.5">应结</div>
                                <div className={cn("font-serif font-bold text-xs", (summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances >= 0 ? "text-emerald-600" : "text-red-500")}>¥{((summary.dailyWage || 0) * summary.totalWorkDays - summary.totalAdvances).toLocaleString()}</div>
                              </div>
                            </div>
                            <ChevronRight className={cn("w-3.5 h-3.5 text-[#5A5A40]/30 transition-transform", expandedTeam === summary.id && "rotate-90")} />
                          </div>
                        </div>
                        
                        {expandedTeam === summary.id && (
                          <div className="bg-[#F5F5F0]/20 border-t border-black/5">
                            {!isLeaderMode && Object.keys(memberStats).length > 0 && (
                              <div className="px-4 py-2">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">成员明细</p>
                                <div className="space-y-1">
                                  {Object.entries(memberStats).map(([mId, mStat]) => (
                                    <div key={mId} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[10px] font-medium text-[#1A1A1A]">{mStat.name}</span>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{formatWorkDays(mStat.workDays)}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {isLeaderMode && (
                              <div className="px-4 py-2">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">每日出工记录</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {teamDetailWorkLogs.sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                    <div key={log.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[9px] font-mono text-[#5A5A40]/60">{log.date}</span>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{log.workerCount}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!isLeaderMode && (
                              <div className="px-4 py-2 border-t border-black/5">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">上班记录</p>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                  {teamDetailWorkLogs.sort((a, b) => b.date.localeCompare(a.date)).map(log => (
                                    <div key={log.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-mono text-[#5A5A40]/60">{log.date}</span>
                                        <span className="text-[9px] text-[#1A1A1A]">{log.memberName || '未知'}</span>
                                      </div>
                                      <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{log.hours}h {formatWorkDays(log.workerCount)}个工</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {teamDetailAdvances.length > 0 && (
                              <div className="px-4 py-2 border-t border-black/5">
                                <p className="text-[8px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1.5">借支记录</p>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {teamDetailAdvances.sort((a, b) => b.date.localeCompare(a.date)).map(adv => (
                                    <div key={adv.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-1.5">
                                      <span className="text-[9px] font-mono text-[#5A5A40]/60">{adv.date}</span>
                                      <span className="text-[10px] font-serif font-bold text-orange-600">¥{adv.amount}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : reportMode === 'project' ? (
          <motion.div 
            key="project"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-2xl p-4 text-white shadow-xl shadow-[#5A5A40]/20">
                <div className="flex items-center gap-1 mb-1 opacity-70">
                  <BarChart3 className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">工地项目</span>
                </div>
                <div className="text-2xl font-serif font-bold">{projectEntries.length}</div>
                <div className="text-[9px] opacity-60 mt-0.5">{timeMode === 'month' ? '本月' : '本年'}活跃项目</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-lg shadow-black/5">
                <div className="flex items-center gap-1 mb-1 text-[#5A5A40]/40">
                  <Users className="w-3 h-3" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">总用工量</span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(allWorkDays)}个工</div>
                <div className="text-[9px] text-[#5A5A40]/40 mt-0.5">全部项目合计</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-black/5 shadow-lg shadow-black/5 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-black/5 bg-[#F5F5F0]/30">
                <h3 className="font-bold text-[10px] text-[#1A1A1A]">工地占比与用工量</h3>
              </div>
              <div className="divide-y divide-black/5">
                {projectEntries.length === 0 ? (
                  <div className="p-8 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                    {timeMode === 'month' ? '本月' : '本年'}暂无工地数据
                  </div>
                ) : (
                  projectEntries.map(([proj, stats]) => {
                    const percent = allWorkDays > 0 ? Math.round((stats.workDays / allWorkDays) * 100) : 0;
                    const barWidth = Math.max(Math.round((stats.workDays / maxProjectWorkDays) * 100), 2);
                    return (
                      <div key={proj} className="px-4 py-2.5 hover:bg-[#F5F5F0]/20 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-md bg-[#5A5A40]/10 flex items-center justify-center">
                              <Info className="w-3 h-3 text-[#5A5A40]" />
                            </div>
                            <span className="font-bold text-[10px] text-[#1A1A1A]">{proj}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-serif font-bold text-[#5A5A40]">{formatWorkDays(stats.workDays)}个工</span>
                            {stats.advances > 0 && <span className="text-[10px] font-serif font-bold text-orange-600">借¥{stats.advances.toLocaleString()}</span>}
                            <span className="text-[9px] font-bold text-[#5A5A40]/40 bg-[#5A5A40]/5 px-1.5 py-0.5 rounded">{percent}%</span>
                          </div>
                        </div>
                        <div className="ml-8 h-1.5 bg-[#F5F5F0] rounded-full overflow-hidden">
                          <div className="h-full bg-[#5A5A40] rounded-full transition-all" style={{width: `${barWidth}%`}} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

function StatementView({ employee, workLogs, advances, onBack }: { 
  employee: Employee, 
  workLogs: WorkLog[], 
  advances: Advance[],
  onBack: () => void
}) {
  const totalWorkDays = workLogs.reduce((sum, l) => sum + l.workDayValue, 0);
  const totalAdvances = advances.reduce((sum, a) => sum + a.amount, 0);
  const estimatedWage = employee.dailyWage ? (totalWorkDays * employee.dailyWage) : 0;
  const balance = estimatedWage - totalAdvances;

  const projectStats = workLogs.reduce((acc, log) => {
    const p = log.project || '未分类';
    acc[p] = (acc[p] || 0) + log.workDayValue;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="p-2 bg-white rounded-xl border border-black/5 text-[#5A5A40] hover:bg-[#F5F5F0] transition-all">
          <ChevronRight className="w-4 h-4 rotate-180" />
        </button>
        {employee.avatar ? (
          <div className="w-9 h-9 rounded-xl overflow-hidden shadow-inner">
            <img src={employee.avatar} alt={employee.name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-9 h-9 bg-gradient-to-br from-[#5A5A40] to-[#4A4A30] rounded-xl flex items-center justify-center text-white font-serif font-bold text-sm shadow-inner">
            {employee.name[0]}
          </div>
        )}
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1A1A1A]">{employee.name} 的对账单</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="w-2.5 h-2.5 text-[#5A5A40]/40" />
            <span className="text-[9px] text-[#5A5A40]/40 font-mono">{employee.phone || '未设置电话'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计工天</p>
          <p className="text-2xl font-serif font-bold text-[#1A1A1A]">{formatWorkDays(totalWorkDays)} <span className="text-[10px] font-sans opacity-40">个工</span></p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-black/5 shadow-sm">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计借支</p>
          <p className="text-2xl font-serif font-bold text-orange-600">¥{totalAdvances.toLocaleString()}</p>
        </div>
        <div className="bg-[#5A5A40] rounded-2xl p-4 shadow-lg shadow-[#5A5A40]/20 text-white">
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-widest mb-1">应结余额</p>
          <p className="text-2xl font-serif font-bold">¥{balance.toLocaleString()}</p>
          {employee.dailyWage && <p className="text-[9px] opacity-40 mt-0.5">¥{employee.dailyWage}/天计算</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col" style={{maxHeight: 'calc(100vh - 340px)'}}>
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
            <Clock className="w-3 h-3 text-[#5A5A40]" />
            <h3 className="font-bold text-[10px] text-[#1A1A1A]">工时明细</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F5F0] text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                  <th className="px-3 py-2">日期</th>
                  <th className="px-3 py-2">项目</th>
                  <th className="px-3 py-2">工时</th>
                  <th className="px-3 py-2">折合</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {workLogs.map(log => (
                  <tr key={log.id} className="text-[10px]">
                    <td className="px-3 py-2 font-mono">{log.date}</td>
                    <td className="px-3 py-2 text-[#5A5A40]">{log.project || '-'}</td>
                    <td className="px-3 py-2">{log.hours}h</td>
                    <td className="px-3 py-2 font-bold">{formatWorkDays(log.workDayValue)}个工</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden flex flex-col" style={{maxHeight: 'calc((100vh - 340px) / 2)'}}>
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-black/5 bg-[#F5F5F0]/30">
              <Wallet className="w-3 h-3 text-[#5A5A40]" />
              <h3 className="font-bold text-[10px] text-[#1A1A1A]">借支明细</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F0] text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">
                    <th className="px-3 py-2">日期</th>
                    <th className="px-3 py-2">金额</th>
                    <th className="px-3 py-2">备注</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {advances.map(adv => (
                    <tr key={adv.id} className="text-[10px]">
                      <td className="px-3 py-2 font-mono">{adv.date}</td>
                      <td className="px-3 py-2 font-bold text-orange-600">¥{adv.amount}</td>
                      <td className="px-3 py-2 text-[#5A5A40]/60">{adv.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-black/5 p-4">
            <h4 className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-3">项目汇总</h4>
            <div className="space-y-2">
              {Object.entries(projectStats).map(([proj, val]) => (
                <div key={proj} className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#1A1A1A]">{proj}</span>
                  <span className="font-serif font-bold text-xs text-[#5A5A40]">{formatWorkDays(val)} 个工</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

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


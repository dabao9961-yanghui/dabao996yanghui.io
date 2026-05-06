export interface Employee {
  id: string;
  name: string;
  phone?: string;
  dailyWage?: number;
  hoursPerDay?: number;
  avatar?: string;
  ownerId: string;
}

export interface WorkLog {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  workDayValue: number;
  project?: string;
  description?: string;
  ownerId: string;
}

export interface Advance {
  id: string;
  employeeId: string;
  date: string;
  amount: number;
  description?: string;
  ownerId: string;
}

export interface AppSettings {
  standardHoursPerDay: number;
  appPassword?: string;
  autoBackupEnabled?: boolean;
  autoBackupInterval?: number;
  backupDirName?: string;
  lastBackupTime?: string;
}

export type TeamMode = 'employee' | 'leader';

export interface TeamMember {
  id: string;
  name: string;
}

export interface Team {
  id: string;
  name: string;
  mode: TeamMode;
  hoursPerDay?: number;
  dailyWage?: number;
  avatar?: string;
  members?: TeamMember[];
  ownerId: string;
}

export interface TeamWorkLog {
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

export interface TeamAdvance {
  id: string;
  teamId: string;
  date: string;
  amount: number;
  description?: string;
  ownerId: string;
}

export enum Tab {
  Dashboard = 'dashboard',
  Employees = 'employees',
  Teams = 'teams',
  Records = 'records',
  Summary = 'summary',
  Settings = 'settings',
  Statement = 'statement',
  TeamDetail = 'teamDetail',
  SalarySettlement = 'salarySettlement',
  ProjectCost = 'projectCost',
}

export interface LocalData {
  employees: Employee[];
  workLogs: WorkLog[];
  advances: Advance[];
  teams: Team[];
  teamWorkLogs: TeamWorkLog[];
  teamAdvances: TeamAdvance[];
  settings: AppSettings;
  projects: string[];
}

export enum OperationType {
  UPDATE = 'update',
  LIST = 'list',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: unknown;
  timestamp: string;
}

export interface EmployeeSummary extends Employee {
  totalWorkDays: number;
  totalAdvances: number;
}

export interface TeamSummary extends Team {
  totalWorkDays: number;
  totalAdvances: number;
}

export interface ProjectStat {
  workDays: number;
  advances: number;
}

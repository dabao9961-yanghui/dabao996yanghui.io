import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import {
  Users,
  Calendar,
  Wallet,
  Trash2,
  ChevronRight,
  Clock,
  DollarSign,
} from 'lucide-react';
import { cn, generateId, formatWorkDays } from '../utils';
import { ImeInput } from './ImeInput';
import type { Team, TeamMember, TeamWorkLog, TeamAdvance } from '../types';

export function TeamDetailView({
  team, teamWorkLogs, teamAdvances, onBack, onAddWorkLog, onAddAdvance,
  onDeleteRecord, onUpdateTeam, savedProjects, onAddProject, onDeleteProject
}: Props) {
  const sortedWorkLogs = useMemo(() => [...teamWorkLogs].sort((a, b) => b.date.localeCompare(a.date)), [teamWorkLogs]);
  const sortedAdvances = useMemo(() => [...teamAdvances].sort((a, b) => b.date.localeCompare(a.date)), [teamAdvances]);
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
          description: desc,
        });
        setWorkerCount('1');
      } else {
        const h = parseFloat(hours) || 0;
        if (!h || !selectedMember || !hoursPerDay) return;
        const member = members.find((m) => m.id === selectedMember);
        onAddWorkLog({
          teamId: team.id,
          date,
          workerCount: h / hoursPerDay,
          memberId: selectedMember,
          memberName: member?.name,
          hours: h,
          project,
          description: desc,
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
        description: desc,
      });
      setAmount('');
    }
    setDesc('');
    setProject('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 bg-white rounded-xl border border-black/5 text-[#5A5A40] hover:bg-[#F5F5F0] transition-all"
        >
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
          <p className="text-[10px] text-[#5A5A40]/40">
            {isLeaderMode ? '组长模式 · 按天记人数' : '员工模式 · 逐人记工天'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-black/5">
          <p className="text-[9px] font-bold text-[#5A5A40]/40 uppercase tracking-widest mb-1">累计工天</p>
          <p className="text-xl font-serif font-bold text-[#1A1A1A]">
            {formatWorkDays(totalWorkDays)}{' '}
            <span className="text-[10px] font-sans opacity-40">个工</span>
          </p>
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
              {members.map((m) => (
                <span
                  key={m.id}
                  className="bg-[#5A5A40]/10 text-[#5A5A40] px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1"
                >
                  {m.name}
                  {showMemberManager && (
                    <button
                      onClick={() =>
                        onUpdateTeam(team.id, {
                          members: members.filter((nm) => nm.id !== m.id),
                        })
                      }
                      className="text-[#5A5A40]/40 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
          {members.length === 0 && (
            <p className="text-[10px] text-[#5A5A40]/40 mb-2">暂无成员，请添加</p>
          )}
          {showMemberManager && (
            <div className="flex gap-2">
              <ImeInput
                placeholder="输入成员姓名"
                value={newMemberName}
                onChange={setNewMemberName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newMemberName.trim()) {
                    e.preventDefault();
                    onUpdateTeam(team.id, {
                      members: [...members, { id: generateId(), name: newMemberName.trim() }],
                    });
                    setNewMemberName('');
                  }
                }}
                className="flex-1 bg-[#F5F5F0] rounded-xl px-4 py-2 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-xs"
              />
              <button
                onClick={() => {
                  if (newMemberName.trim()) {
                    onUpdateTeam(team.id, {
                      members: [...members, { id: generateId(), name: newMemberName.trim() }],
                    });
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

      <div
        className="grid grid-cols-1 lg:grid-cols-10 gap-4"
        style={{ height: 'calc(100vh - 380px)', minHeight: '300px' }}
      >
        <div className="lg:col-span-4 bg-white rounded-2xl border border-black/5 flex flex-col overflow-hidden">
          <div className="flex bg-[#F5F5F0] p-1 rounded-lg m-3 mb-0">
            <button
              onClick={() => setType('work')}
              className={cn(
                'flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs',
                type === 'work'
                  ? 'bg-white text-[#5A5A40] shadow-sm'
                  : 'text-[#5A5A40]/40 hover:text-[#5A5A40]/60',
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              记工天
            </button>
            <button
              onClick={() => setType('advance')}
              className={cn(
                'flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 text-xs',
                type === 'advance'
                  ? 'bg-white text-[#5A5A40] shadow-sm'
                  : 'text-[#5A5A40]/40 hover:text-[#5A5A40]/60',
              )}
            >
              <Wallet className="w-3.5 h-3.5" />
              记借支
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 space-y-3">
            {type === 'work' && isLeaderMode ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                    日期
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                    出工人数 (个工)
                  </label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input
                      type="number"
                      step="1"
                      min="1"
                      placeholder="输入人数"
                      value={workerCount}
                      onChange={(e) => setWorkerCount(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-20 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => setWorkerCount('1')}
                        className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5"
                      >
                        1
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkerCount('5')}
                        className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5"
                      >
                        5
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkerCount('10')}
                        className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-black/5"
                      >
                        10
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : type === 'work' && !isLeaderMode ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                      日期
                    </label>
                    <div className="relative mt-1">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                      选择成员
                    </label>
                    <div className="relative mt-1">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                      <select
                        value={selectedMember}
                        onChange={(e) => setSelectedMember(e.target.value)}
                        className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none appearance-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                        required
                      >
                        <option value="">选择成员</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                    工时 ({hoursPerDay}小时=1个工)
                  </label>
                  <div className="relative mt-1">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="输入工时"
                      value={hours}
                      onChange={(e) => setHours(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-20 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                      required
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-0.5">
                      <button
                        type="button"
                        onClick={() => setHours(hoursPerDay.toString())}
                        className="text-[10px] bg-white px-2 py-1 rounded-lg border border-black/5 font-bold"
                      >
                        全天
                      </button>
                      <button
                        type="button"
                        onClick={() => setHours((hoursPerDay / 2).toString())}
                        className="text-[10px] bg-white px-2 py-1 rounded-lg border border-black/5 font-bold"
                      >
                        半天
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                    日期
                  </label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                    借支金额 (元)
                  </label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5A5A40]/30" />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="输入金额"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-[#F5F5F0] rounded-xl pl-10 pr-3 py-2.5 outline-none font-bold text-sm text-[#1A1A1A] focus:ring-2 ring-[#5A5A40]/10 transition-all"
                      required
                    />
                  </div>
                </div>
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                项目
              </label>
              <ImeInput
                placeholder="输入项目名称"
                value={project}
                onChange={setProject}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && project.trim() && !savedProjects.includes(project.trim())) {
                    e.preventDefault();
                    onAddProject(project.trim());
                  }
                }}
                className="w-full bg-[#F5F5F0] rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm mt-1"
              />
              {savedProjects.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {savedProjects.map((p) => (
                    <div
                      key={p}
                      className={cn(
                        'text-[8px] px-1.5 py-0.5 rounded border transition-all flex items-center gap-0.5 group/proj',
                        project === p
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                          : 'bg-white text-[#5A5A40]/60 border-black/5 hover:border-[#5A5A40]/30',
                      )}
                    >
                      <button type="button" onClick={() => setProject(p)} className="cursor-pointer">
                        {p}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteProject(p)}
                        className="text-[#5A5A40]/20 hover:text-red-500 transition-colors opacity-0 group-hover/proj:opacity-100"
                      >
                        <Trash2 className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#5A5A40]/40 uppercase ml-1 tracking-widest">
                备注
              </label>
              <ImeInput
                placeholder="可选"
                value={desc}
                onChange={setDesc}
                className="w-full bg-[#F5F5F0] rounded-xl px-4 py-2.5 outline-none focus:ring-2 ring-[#5A5A40]/10 transition-all text-sm mt-1"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#5A5A40] text-white py-2.5 rounded-xl font-bold shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all active:scale-[0.98] text-sm"
            >
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
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                暂无上班记录
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {sortedWorkLogs.map((rec) => (
                  <div
                    key={rec.id}
                    className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          {isLeaderMode ? (
                            <span className="text-[10px] font-bold text-[#5A5A40]">
                              {rec.workerCount}人
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#5A5A40]">
                              {rec.memberName || '未知'}
                            </span>
                          )}
                          <span className="text-[9px] font-mono text-[#5A5A40]/40">{rec.date}</span>
                        </div>
                        <p className="text-[10px] font-medium text-[#1A1A1A]">
                          {isLeaderMode
                            ? `${rec.workerCount}个工`
                            : `${rec.hours}小时 / ${formatWorkDays(rec.workerCount)}个工`}
                        </p>
                        {rec.project && (
                          <p className="text-[8px] text-[#5A5A40]/40">{rec.project}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteRecord(rec.id, 'work')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
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
              <div className="p-6 text-center text-[#5A5A40]/30 text-[10px] font-medium">
                暂无借支记录
              </div>
            ) : (
              <div className="divide-y divide-black/5">
                {sortedAdvances.map((rec) => (
                  <div
                    key={rec.id}
                    className="px-3 py-2 flex items-center justify-between group hover:bg-[#F5F5F0]/30 transition-colors"
                  >
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
                        {rec.description && (
                          <p className="text-[8px] text-[#5A5A40]/40">{rec.description}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteRecord(rec.id, 'advance')}
                      className="p-0.5 text-red-500/0 group-hover:text-red-500 transition-all"
                    >
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

export default TeamDetailView;

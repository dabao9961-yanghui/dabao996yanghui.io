import React from 'react';
import { cn } from '../utils';

export function NavButton({ active, onClick, icon, label }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
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

export default NavButton;

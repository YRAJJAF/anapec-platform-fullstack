// ── CefrBadge.tsx ────────────────────────────────────────────────────────────
import clsx from 'clsx';

const styles: Record<string, string> = {
  A1: 'bg-green-100 text-green-700 border-green-200',
  A2: 'bg-lime-100 text-lime-700 border-lime-200',
  B1: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  B2: 'bg-orange-100 text-orange-700 border-orange-200',
  C1: 'bg-red-100 text-red-700 border-red-200',
  C2: 'bg-purple-100 text-purple-700 border-purple-200',
};

export function CefrBadge({ level, large = false }: { level: string; large?: boolean }) {
  return (
    <span className={clsx(
      'inline-flex items-center justify-center font-bold border rounded',
      styles[level] ?? 'bg-slate-100 text-slate-500 border-slate-200',
      large ? 'px-4 py-2 text-2xl rounded-lg' : 'px-2 py-0.5 text-xs',
    )}>
      {level}
    </span>
  );
}

// ── StatCard.tsx ─────────────────────────────────────────────────────────────
import { ReactNode } from 'react';

const colorMap: Record<string, string> = {
  brand:   'bg-brand-50',
  emerald: 'bg-emerald-50',
  amber:   'bg-amber-50',
  purple:  'bg-purple-50',
  red:     'bg-red-50',
};

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export function StatCard({ icon, label, value, sub, color = 'brand' }: StatCardProps) {
  return (
    <div className="card p-5">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center mb-3', colorMap[color] ?? colorMap.brand)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── ProgressRing.tsx ─────────────────────────────────────────────────────────
export function ProgressRing({ progress, size = 48 }: { progress: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;

  return (
    <svg width={size} height={size} className="flex-shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={4} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#1a5f7a" strokeWidth={4}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle" dominantBaseline="central"
        fontSize={size < 40 ? 9 : 11} fontWeight={600}
        fill="#1a5f7a"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${size / 2}px ${size / 2}px` }}
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
}

// ── LoadingSpinner.tsx ────────────────────────────────────────────────────────
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      <p className="text-sm text-slate-400">{label}</p>
    </div>
  );
}

// ── EmptyState.tsx ────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="text-slate-200">{icon}</div>
      <p className="font-medium text-slate-500">{title}</p>
      {description && <p className="text-sm text-slate-400 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}

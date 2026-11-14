import clsx from "clsx";
import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone = "brand" }: { label: string; value: ReactNode; hint?: string; tone?: "brand" | "green" | "amber" | "red" }) {
  const dot = { brand: "bg-brand", green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500" }[tone];
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-soft">
        <span className={clsx("h-2 w-2 rounded-full", dot)} /> {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-mute">{hint}</div>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  blue: "bg-sky-50 text-sky-700 ring-sky-200",
  gray: "bg-slate-100 text-slate-600 ring-slate-200",
};
export function Badge({ tone = "gray", children }: { tone?: keyof typeof badgeTones; children: ReactNode }) {
  return <span className={clsx("inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", badgeTones[tone])}>{children}</span>;
}

export const statusTone = (s: string) =>
  ({ paid: "green", active: "green", admitted: "green", present: "green",
     partial: "amber", open: "amber", late: "amber", excused: "blue",
     unpaid: "red", absent: "red", void: "gray", closed: "gray", inactive: "gray", alumni: "blue" } as Record<string, string>)[s] ?? "gray";

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full">
        <thead className="border-b border-surface-line bg-surface-alt/60">
          <tr>{head.map((h) => <th key={h} className="th">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-surface-line">{children}</tbody>
      </table>
      {empty && <div className="px-4 py-10 text-center text-sm text-ink-mute">{empty}</div>}
    </div>
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <div className={className}><label className="label">{label}</label>{children}</div>;
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: ReactNode; variant?: "primary" | "ghost" }) {
  return <Link href={href} className={variant === "primary" ? "btn-primary" : "btn-ghost"}>{children}</Link>;
}

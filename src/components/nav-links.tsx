"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard, MessageSquarePlus, Users, CalendarCheck, Wallet, GraduationCap,
  Library, Award, Layers, Banknote,
} from "lucide-react";

const ICONS = { LayoutDashboard, MessageSquarePlus, Users, CalendarCheck, Wallet, GraduationCap, Library, Award, Layers, Banknote };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="space-y-1">
      {items.map(({ href, label, icon }) => {
        const Icon = ICONS[icon];
        const active = href === "/" ? path === "/" : path.startsWith(href);
        return (
          <Link key={href} href={href}
            className={clsx("flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
              active ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-surface-alt hover:text-ink")}>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}

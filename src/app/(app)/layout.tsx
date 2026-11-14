import { redirect } from "next/navigation";
import { LogOut, Music2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NavLinks, type NavItem } from "@/components/nav-links";
import { signOut } from "../login/actions";

const NAV: (NavItem & { roles: string[] })[] = [
  { href: "/", label: "Dashboard", icon: "LayoutDashboard", roles: ["admin", "staff", "teacher"] },
  { href: "/enquiries", label: "Enquiries", icon: "MessageSquarePlus", roles: ["admin", "staff"] },
  { href: "/students", label: "Students", icon: "Users", roles: ["admin", "staff", "teacher"] },
  { href: "/batches", label: "Batches", icon: "Layers", roles: ["admin", "staff", "teacher"] },
  { href: "/attendance", label: "Attendance", icon: "CalendarCheck", roles: ["admin", "staff", "teacher"] },
  { href: "/fees", label: "Fees", icon: "Wallet", roles: ["admin", "staff"] },
  { href: "/teachers", label: "Teachers", icon: "GraduationCap", roles: ["admin", "staff"] },
  { href: "/payroll", label: "Payroll", icon: "Banknote", roles: ["admin"] },
  { href: "/library", label: "Library", icon: "Library", roles: ["admin", "staff"] },
  { href: "/certificates", label: "Certificates", icon: "Award", roles: ["admin", "staff"] },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
  const role = profile?.role ?? "staff";
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="hidden border-r border-surface-line bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white"><Music2 className="h-5 w-5" /></span>
          <div className="leading-tight">
            <div className="text-sm font-semibold">Taught To Teach</div>
            <div className="text-xs text-ink-mute">Music · Art · Dance</div>
          </div>
        </div>
        <div className="flex-1 px-3"><NavLinks items={items} /></div>
        <div className="border-t border-surface-line p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
              {(profile?.full_name || user.email || "?").slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-medium">{profile?.full_name || user.email}</div>
              <div className="text-xs capitalize text-ink-mute">{role}</div>
            </div>
          </div>
          <form action={signOut}><button className="btn-ghost w-full"><LogOut className="h-4 w-4" /> Sign out</button></form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* mobile top bar */}
        <header className="flex items-center justify-between border-b border-surface-line bg-white px-4 py-3 lg:hidden">
          <span className="flex items-center gap-2 text-sm font-semibold"><Music2 className="h-5 w-5 text-brand" /> Taught To Teach</span>
          <form action={signOut}><button className="btn-ghost px-3 py-1.5">Sign out</button></form>
        </header>
        <div className="overflow-x-auto border-b border-surface-line bg-white px-3 py-2 lg:hidden">
          <div className="flex gap-1">
            {items.map((i) => <a key={i.href} href={i.href} className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-alt">{i.label}</a>)}
          </div>
        </div>
        <main className="mx-auto max-w-6xl p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

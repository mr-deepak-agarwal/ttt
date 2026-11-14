"use client";
import { useActionState } from "react";
import { Music2 } from "lucide-react";
import { signIn } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, undefined);
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-gradient-to-br from-brand to-[#2a1a8f] p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold"><Music2 className="h-6 w-6" /> Taught To Teach</div>
        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">Run the whole academy from one calm screen.</h2>
          <p className="mt-4 max-w-md text-white/70">Enquiries, admissions, batches, attendance, fees and payroll — in one place.</p>
        </div>
        <p className="text-sm text-white/50">School of Music, Art and Dance · Margao, Goa</p>
      </section>
      <section className="flex items-center justify-center p-6">
        <form action={action} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-ink-soft">Use your staff account.</p>
          </div>
          <div><label className="label">Email</label><input name="email" type="email" required className="input" autoComplete="email" /></div>
          <div><label className="label">Password</label><input name="password" type="password" required className="input" autoComplete="current-password" /></div>
          {state?.error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <button className="btn-primary w-full" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
        </form>
      </section>
    </main>
  );
}

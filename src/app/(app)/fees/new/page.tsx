import { createClient } from "@/lib/supabase/server";
import { PageHeader, Field } from "@/components/ui";
import { createInvoice } from "../actions";

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const { student } = await searchParams;
  const supabase = await createClient();
  const [{ data: students }, { data: items }] = await Promise.all([
    supabase.from("students").select("id, full_name, admission_no").eq("status", "active").order("full_name"),
    supabase.from("fee_items").select("name, amount_paise").eq("active", true).order("name"),
  ]);
  const lines = [...(items ?? []).map((i) => ({ d: i.name, a: "" })), { d: "", a: "" }, { d: "", a: "" }];
  return (
    <>
      <PageHeader title="New invoice" subtitle="Fill in only the lines that apply — empty lines are ignored." />
      <form action={createInvoice} className="card max-w-3xl space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Student *"><select name="student_id" required defaultValue={student} className="input"><option value="">Select…</option>
            {students?.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}</select></Field>
          <Field label="Title"><input name="title" defaultValue="Fees" className="input" /></Field>
          <Field label="Due date"><input name="due_on" type="date" className="input" /></Field>
        </div>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_140px] gap-2 text-xs font-medium text-ink-soft"><span>Description</span><span>Amount (₹)</span></div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_140px] gap-2">
              <input name="desc" defaultValue={l.d} className="input" placeholder="Description" />
              <input name="amount" defaultValue={l.a} className="input" inputMode="decimal" placeholder="0" />
            </div>
          ))}
        </div>
        <button className="btn-primary">Create invoice</button>
      </form>
    </>
  );
}

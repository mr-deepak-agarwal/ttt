import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Field } from "@/components/ui";
import { rupees, fmtDate, today } from "@/lib/format";
import { addPayroll } from "./actions";

export const dynamic = "force-dynamic";

export default async function Payroll() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (me?.role !== "admin") redirect("/");

  const [{ data: teachers }, { data: rows }] = await Promise.all([
    supabase.from("teachers").select("id, full_name, monthly_salary_paise").eq("active", true).order("full_name"),
    supabase.from("payroll").select("*, teachers(full_name)").order("paid_on", { ascending: false }).limit(100),
  ]);
  const thisMonth = today().slice(0, 7);
  const total = (rows ?? []).filter((r) => r.period === thisMonth).reduce((s, r) => s + r.amount_paise, 0);

  return (
    <>
      <PageHeader title="Payroll" subtitle={`Paid for ${thisMonth}: ${rupees(total)}`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Teacher", "Period", "Paid on", "Note", "Amount"]} empty={rows?.length ? undefined : "No payments recorded."}>
          {(rows ?? []).map((r: any) => (
            <tr key={r.id}><td className="td font-medium">{r.teachers?.full_name}</td><td className="td">{r.period}</td>
              <td className="td text-ink-soft">{fmtDate(r.paid_on)}</td><td className="td text-ink-soft">{r.description ?? "—"}</td><td className="td">{rupees(r.amount_paise)}</td></tr>
          ))}
        </Table>
        <form action={addPayroll} className="card h-fit space-y-3 p-5">
          <h3 className="font-semibold">Record salary</h3>
          <Field label="Teacher *"><select name="teacher_id" required className="input"><option value="">Select…</option>
            {teachers?.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field>
          <Field label="Period"><input name="period" type="month" defaultValue={thisMonth} className="input" /></Field>
          <Field label="Amount (₹) *"><input name="amount" required className="input" inputMode="decimal" /></Field>
          <Field label="Paid on"><input name="paid_on" type="date" defaultValue={today()} className="input" /></Field>
          <Field label="Note"><input name="description" className="input" placeholder="Salary / bonus…" /></Field>
          <button className="btn-primary w-full">Save</button>
        </form>
      </div>
    </>
  );
}

import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Badge, Field } from "@/components/ui";
import { rupees } from "@/lib/format";
import { addTeacher, toggleTeacher } from "./actions";

export const dynamic = "force-dynamic";

export default async function Teachers() {
  const supabase = await createClient();
  const { data } = await supabase.from("teachers").select("*").order("full_name");
  return (
    <>
      <PageHeader title="Teachers" subtitle="Faculty directory. Admins can add and deactivate teachers." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Table head={["Name", "Instruments", "Phone", "Salary / month", ""]} empty={data?.length ? undefined : "No teachers yet."}>
          {(data ?? []).map((t) => (
            <tr key={t.id}>
              <td className="td font-medium">{t.full_name} {!t.active && <Badge>inactive</Badge>}</td>
              <td className="td text-ink-soft">{t.instruments.join(", ") || "—"}</td>
              <td className="td text-ink-soft">{t.phone ?? "—"}</td>
              <td className="td">{rupees(t.monthly_salary_paise)}</td>
              <td className="td text-right">
                <form action={toggleTeacher}><input type="hidden" name="id" value={t.id} /><input type="hidden" name="active" value={String(!t.active)} />
                  <button className="text-xs text-ink-soft hover:text-brand">{t.active ? "Deactivate" : "Activate"}</button></form>
              </td>
            </tr>
          ))}
        </Table>
        <form action={addTeacher} className="card h-fit space-y-3 p-5">
          <h3 className="font-semibold">Add teacher</h3>
          <Field label="Full name *"><input name="full_name" required className="input" /></Field>
          <Field label="Phone"><input name="phone" className="input" /></Field>
          <Field label="Email"><input name="email" type="email" className="input" /></Field>
          <Field label="Instruments (comma separated)"><input name="instruments" className="input" placeholder="Piano, Keyboard" /></Field>
          <Field label="Monthly salary (₹)"><input name="salary" className="input" inputMode="decimal" /></Field>
          <button className="btn-primary w-full">Add teacher</button>
        </form>
      </div>
    </>
  );
}

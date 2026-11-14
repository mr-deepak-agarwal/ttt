import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, Field } from "@/components/ui";
import { fmtDate } from "@/lib/format";
import { addBook, issueBook, returnBook } from "./actions";

export const dynamic = "force-dynamic";

export default async function Library() {
  const supabase = await createClient();
  const [{ data: books }, { data: loans }, { data: students }] = await Promise.all([
    supabase.from("books").select("id, title, copies").order("title"),
    supabase.from("book_loans").select("id, book_id, issued_on, returned_on, books(title), students(full_name)").order("issued_on", { ascending: false }).limit(100),
    supabase.from("students").select("id, full_name, admission_no").eq("status", "active").order("full_name"),
  ]);
  const out = new Map<string, number>();
  (loans ?? []).filter((l) => !l.returned_on).forEach((l) => out.set(l.book_id, (out.get(l.book_id) ?? 0) + 1));

  return (
    <>
      <PageHeader title="Library" subtitle="Books and who has them." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 font-semibold">Loans</h2>
            <Table head={["Book", "Student", "Issued", "Returned", ""]} empty={loans?.length ? undefined : "No loans yet."}>
              {(loans ?? []).map((l: any) => (
                <tr key={l.id}>
                  <td className="td font-medium">{l.books?.title}</td><td className="td">{l.students?.full_name}</td>
                  <td className="td text-ink-soft">{fmtDate(l.issued_on)}</td>
                  <td className="td text-ink-soft">{l.returned_on ? fmtDate(l.returned_on) : <span className="text-amber-600">Out</span>}</td>
                  <td className="td text-right">{!l.returned_on && <form action={returnBook}><input type="hidden" name="id" value={l.id} /><button className="text-xs text-brand">Mark returned</button></form>}</td>
                </tr>
              ))}
            </Table>
          </section>
          <section>
            <h2 className="mb-3 font-semibold">Books</h2>
            <Table head={["Title", "Copies", "Available"]} empty={books?.length ? undefined : "No books yet."}>
              {(books ?? []).map((b) => <tr key={b.id}><td className="td font-medium">{b.title}</td><td className="td">{b.copies}</td><td className="td">{b.copies - (out.get(b.id) ?? 0)}</td></tr>)}
            </Table>
          </section>
        </div>
        <div className="space-y-6">
          <form action={issueBook} className="card space-y-3 p-5">
            <h3 className="font-semibold">Issue a book</h3>
            <Field label="Book"><select name="book_id" required className="input"><option value="">Select…</option>{books?.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}</select></Field>
            <Field label="Student"><select name="student_id" required className="input"><option value="">Select…</option>{students?.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}</select></Field>
            <button className="btn-primary w-full">Issue</button>
          </form>
          <form action={addBook} className="card space-y-3 p-5">
            <h3 className="font-semibold">Add a book</h3>
            <Field label="Title"><input name="title" required className="input" /></Field>
            <Field label="Copies"><input name="copies" type="number" min={1} defaultValue={1} className="input" /></Field>
            <button className="btn-ghost w-full">Add book</button>
          </form>
        </div>
      </div>
    </>
  );
}

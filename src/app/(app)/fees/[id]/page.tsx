import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, statusTone, Table } from "@/components/ui";
import { rupees, fmtDate, today } from "@/lib/format";
import { recordPayment, voidInvoice } from "../actions";
import { PrintButton } from "@/components/print-button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoice_summary").select("*").eq("id", id).single();
  if (!inv) notFound();
  const [{ data: lines }, { data: pays }] = await Promise.all([
    supabase.from("invoice_items").select("*").eq("invoice_id", id),
    supabase.from("payments").select("*").eq("invoice_id", id).order("paid_on"),
  ]);
  const balance = inv.total_paise - inv.paid_paise;

  return (
    <>
      <PageHeader title={`Invoice #${inv.invoice_no}`}
        subtitle={`${inv.title} · ${inv.student_name} · ${fmtDate(inv.issued_on)}`}
        action={<div className="flex items-center gap-2 print:hidden"><Badge tone={statusTone(inv.status) as never}>{inv.status}</Badge><PrintButton /></div>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Table head={["Description", "Amount"]}>
            {(lines ?? []).map((l) => <tr key={l.id}><td className="td">{l.description}</td><td className="td">{rupees(l.amount_paise)}</td></tr>)}
            <tr className="bg-surface-alt/60 font-semibold"><td className="td">Total</td><td className="td">{rupees(inv.total_paise)}</td></tr>
            <tr><td className="td text-ink-soft">Paid</td><td className="td">{rupees(inv.paid_paise)}</td></tr>
            <tr className="font-semibold"><td className="td">Balance</td><td className="td">{rupees(balance)}</td></tr>
          </Table>
          <section>
            <h2 className="mb-3 font-semibold">Payments</h2>
            <Table head={["Receipt", "Date", "Method", "Reference", "Amount"]} empty={pays?.length ? undefined : "No payments yet."}>
              {(pays ?? []).map((p) => (
                <tr key={p.id}><td className="td">R-{p.receipt_no}</td><td className="td">{fmtDate(p.paid_on)}</td>
                  <td className="td uppercase text-ink-soft">{p.method}</td><td className="td text-ink-soft">{p.reference ?? "—"}</td><td className="td">{rupees(p.amount_paise)}</td></tr>
              ))}
            </Table>
          </section>
        </div>

        <aside className="space-y-6 print:hidden">
          {inv.status !== "void" && balance > 0 && (
            <form action={recordPayment} className="card space-y-3 p-5">
              <h3 className="font-semibold">Record payment</h3>
              <input type="hidden" name="invoice_id" value={inv.id} />
              <div><label className="label">Amount (₹)</label><input name="amount" defaultValue={balance / 100} className="input" inputMode="decimal" required /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="label">Method</label>
                  <select name="method" className="input"><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank</option><option value="cheque">Cheque</option></select></div>
                <div><label className="label">Date</label><input name="paid_on" type="date" defaultValue={today()} className="input" /></div>
              </div>
              <div><label className="label">Reference</label><input name="reference" className="input" placeholder="UPI ref / cheque no." /></div>
              <button className="btn-primary w-full">Save payment</button>
            </form>
          )}
          <div className="card space-y-2 p-5 text-sm">
            <Link href={`/students/${inv.student_id}`} className="text-brand">View student →</Link>
            {inv.status !== "void" && (
              <form action={voidInvoice}><input type="hidden" name="id" value={inv.id} /><button className="btn-danger w-full">Void invoice</button></form>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

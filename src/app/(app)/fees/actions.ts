"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str, toPaise, today } from "@/lib/format";

export async function createInvoice(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: inv, error } = await supabase.from("invoices")
    .insert({ student_id: str(fd, "student_id"), title: str(fd, "title") ?? "Fees", due_on: str(fd, "due_on"), created_by: user?.id })
    .select("id").single();
  if (error || !inv) throw new Error(error?.message ?? "Failed");
  const descs = fd.getAll("desc").map(String), amts = fd.getAll("amount");
  const items = descs.map((d, i) => ({ invoice_id: inv.id, description: d.trim(), amount_paise: toPaise(amts[i]) }))
    .filter((i) => i.description && i.amount_paise > 0);
  if (items.length) await supabase.from("invoice_items").insert(items);
  revalidatePath("/fees");
  redirect(`/fees/${inv.id}`);
}

export async function recordPayment(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const invoice_id = String(fd.get("invoice_id"));
  const amount_paise = toPaise(fd.get("amount"));
  if (amount_paise <= 0) return;
  const { error } = await supabase.from("payments").insert({
    invoice_id, amount_paise, method: str(fd, "method") ?? "cash", reference: str(fd, "reference"),
    paid_on: str(fd, "paid_on") ?? today(), received_by: user?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/fees/${invoice_id}`); revalidatePath("/fees");
}

export async function voidInvoice(fd: FormData) {
  const supabase = await createClient();
  const id = String(fd.get("id"));
  await supabase.from("invoices").update({ status: "void" }).eq("id", id);
  revalidatePath(`/fees/${id}`); revalidatePath("/fees");
}

/** Bills Tuition for the given month to every active student that has not been billed yet. */
export async function generateMonthlyTuition(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const month = str(fd, "month") ?? today().slice(0, 7);               // 2026-11
  const label = new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  const title = `Tuition ${label}`;
  const { data: fee } = await supabase.from("fee_items").select("name, amount_paise").eq("name", "Tuition").single();
  if (!fee) throw new Error("Add a fee item named 'Tuition' first.");
  const [{ data: students }, { data: existing }] = await Promise.all([
    supabase.from("students").select("id").eq("status", "active"),
    supabase.from("invoices").select("student_id").eq("title", title).neq("status", "void"),
  ]);
  const billed = new Set((existing ?? []).map((e) => e.student_id));
  const todo = (students ?? []).filter((s) => !billed.has(s.id));
  if (todo.length) {
    const { data: invs, error } = await supabase.from("invoices")
      .insert(todo.map((s) => ({ student_id: s.id, title, due_on: `${month}-10`, created_by: user?.id }))).select("id");
    if (error) throw new Error(error.message);
    await supabase.from("invoice_items").insert((invs ?? []).map((i) => ({ invoice_id: i.id, description: fee.name, amount_paise: fee.amount_paise })));
  }
  revalidatePath("/fees");
  redirect(`/fees?generated=${todo.length}`);
}

export async function updateFeeItem(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("fee_items").update({ amount_paise: toPaise(fd.get("amount")) }).eq("id", String(fd.get("id")));
  revalidatePath("/fees");
}

import type { SupabaseClient } from "@supabase/supabase-js";

type StudentInsert = Record<string, unknown> & { full_name: string };

/**
 * Creates a student and an opening invoice built from the active fee items
 * (the old system's Admission / Tuition / Books / Outdoor lines).
 * Returns the new student id.
 */
export async function admitStudent(supabase: SupabaseClient, student: StudentInsert, userId: string) {
  const { data: branch } = await supabase.from("branches").select("id").order("created_at").limit(1).single();
  const { data: created, error } = await supabase
    .from("students")
    .insert({ ...student, branch_id: branch?.id, created_by: userId })
    .select("id, admission_no")
    .single();
  if (error || !created) throw new Error(error?.message ?? "Could not create student");

  const { data: items } = await supabase.from("fee_items").select("name, amount_paise").eq("active", true);
  if (items?.length) {
    const { data: inv, error: invErr } = await supabase
      .from("invoices")
      .insert({ student_id: created.id, title: "Admission & first month", created_by: userId })
      .select("id").single();
    if (invErr || !inv) throw new Error(invErr?.message ?? "Could not create invoice");
    await supabase.from("invoice_items").insert(
      items.map((i) => ({ invoice_id: inv.id, description: i.name, amount_paise: i.amount_paise }))
    );
  }
  return created.id as string;
}

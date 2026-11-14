"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str, toPaise, today } from "@/lib/format";

export async function addPayroll(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const amount = toPaise(fd.get("amount"));
  if (amount <= 0) return;
  const { error } = await supabase.from("payroll").insert({
    teacher_id: str(fd, "teacher_id"), period: str(fd, "period") ?? today().slice(0, 7),
    amount_paise: amount, description: str(fd, "description"), paid_on: str(fd, "paid_on") ?? today(), created_by: user?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/payroll");
}

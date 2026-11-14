"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str, toPaise } from "@/lib/format";

export async function addTeacher(fd: FormData) {
  const supabase = await createClient();
  const { data: branch } = await supabase.from("branches").select("id").limit(1).single();
  const { error } = await supabase.from("teachers").insert({
    full_name: str(fd, "full_name"), phone: str(fd, "phone"), email: str(fd, "email"),
    instruments: (str(fd, "instruments") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
    monthly_salary_paise: toPaise(fd.get("salary")), branch_id: branch?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/teachers");
}

export async function toggleTeacher(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("teachers").update({ active: fd.get("active") === "true" }).eq("id", String(fd.get("id")));
  revalidatePath("/teachers");
}

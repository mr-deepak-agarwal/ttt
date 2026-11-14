"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveAttendance(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const batch_id = String(fd.get("batch_id"));
  const attended_on = String(fd.get("date"));
  const teacher_id = String(fd.get("teacher_id") || "") || null;
  const class_mode = String(fd.get("class_mode") || "group");
  const rows = fd.getAll("student_id").map((sid) => ({
    student_id: String(sid), batch_id, teacher_id, attended_on, class_mode,
    status: String(fd.get(`status_${sid}`) ?? "present"), marked_by: user?.id,
  }));
  if (rows.length) {
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,batch_id,attended_on" });
    if (error) throw new Error(error.message);
  }
  revalidatePath("/attendance");
}

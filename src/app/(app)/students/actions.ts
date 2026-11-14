"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { personFromForm } from "@/lib/person";
import { str } from "@/lib/format";
import { admitStudent } from "@/lib/admit";

export async function admitDirect(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const id = await admitStudent(supabase, {
    ...personFromForm(fd), dob: str(fd, "dob"),
    lessons_per_week: Number(fd.get("lessons_per_week")) || 1,
    indoor_outdoor: str(fd, "indoor_outdoor"),
  }, user!.id);
  revalidatePath("/students");
  redirect(`/students/${id}`);
}

export async function setStudentStatus(fd: FormData) {
  const supabase = await createClient();
  const id = String(fd.get("id"));
  await supabase.from("students").update({ status: String(fd.get("status")) }).eq("id", id);
  revalidatePath(`/students/${id}`); revalidatePath("/students");
}

export async function enrollStudent(fd: FormData) {
  const supabase = await createClient();
  const student_id = String(fd.get("student_id"));
  const batch_id = String(fd.get("batch_id"));
  if (batch_id) await supabase.from("enrollments").upsert({ student_id, batch_id }, { onConflict: "student_id,batch_id" });
  revalidatePath(`/students/${student_id}`);
}

export async function uploadPhoto(fd: FormData) {
  const supabase = await createClient();
  const id = String(fd.get("id"));
  const file = fd.get("photo");
  if (file instanceof File && file.size > 0 && file.size < 5_000_000) {
    const path = `${id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("student-photos").upload(path, file);
    if (!error) await supabase.from("students").update({ photo_path: path }).eq("id", id);
  }
  revalidatePath(`/students/${id}`);
}

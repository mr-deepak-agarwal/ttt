"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

export async function addCertificate(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let file_path: string | null = null;
  const file = fd.get("file");
  if (file instanceof File && file.size > 0 && file.size < 10_000_000) {
    file_path = `${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from("certificates").upload(file_path, file);
    if (error) throw new Error(error.message);
  }
  const { error } = await supabase.from("certificates").insert({
    student_id: str(fd, "student_id"), teacher_id: str(fd, "teacher_id"), instrument: str(fd, "instrument"),
    grade: str(fd, "grade"), session: str(fd, "session"), file_path, created_by: user?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/certificates");
}

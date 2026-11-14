"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

export async function createBatch(fd: FormData) {
  const supabase = await createClient();
  const { data: branch } = await supabase.from("branches").select("id").limit(1).single();
  const { error } = await supabase.from("batches").insert({
    name: str(fd, "name"), course_id: str(fd, "course_id"), teacher_id: str(fd, "teacher_id"),
    class_mode: str(fd, "class_mode") ?? "group",
    weekdays: fd.getAll("weekdays").map(Number),
    start_time: str(fd, "start_time"), end_time: str(fd, "end_time"),
    room: str(fd, "room"), capacity: Number(fd.get("capacity")) || null, branch_id: branch?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/batches");
  redirect("/batches");
}

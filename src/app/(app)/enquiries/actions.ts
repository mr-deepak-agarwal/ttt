"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { personFromForm } from "@/lib/person";
import { str } from "@/lib/format";
import { admitStudent } from "@/lib/admit";

export async function createEnquiry(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: branch } = await supabase.from("branches").select("id").limit(1).single();
  const age = Number(fd.get("age"));
  const { error } = await supabase.from("enquiries").insert({
    ...personFromForm(fd), age: Number.isFinite(age) && age > 0 ? age : null,
    remarks: str(fd, "remarks"), branch_id: branch?.id, created_by: user?.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/enquiries");
  redirect("/enquiries");
}

export async function closeEnquiry(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("enquiries").update({ status: "closed", updated_at: new Date().toISOString() }).eq("id", String(fd.get("id")));
  revalidatePath("/enquiries");
  redirect("/enquiries");
}

export async function admitFromEnquiry(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const enquiryId = String(fd.get("enquiry_id"));
  const dob = str(fd, "dob");
  const lessons = Number(fd.get("lessons_per_week")) || 1;
  const studentId = await admitStudent(supabase, {
    ...personFromForm(fd), dob, lessons_per_week: lessons,
    indoor_outdoor: str(fd, "indoor_outdoor"), enquiry_id: enquiryId,
  }, user!.id);
  await supabase.from("enquiries").update({ status: "admitted", updated_at: new Date().toISOString() }).eq("id", enquiryId);
  revalidatePath("/enquiries"); revalidatePath("/students");
  redirect(`/students/${studentId}`);
}

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { str } from "@/lib/format";

export async function addBook(fd: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.from("books").insert({ title: str(fd, "title"), copies: Number(fd.get("copies")) || 1 });
  if (error) throw new Error(error.message);
  revalidatePath("/library");
}

export async function issueBook(fd: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const book_id = str(fd, "book_id"), student_id = str(fd, "student_id");
  if (!book_id || !student_id) return;
  const [{ data: book }, { count }] = await Promise.all([
    supabase.from("books").select("copies").eq("id", book_id).single(),
    supabase.from("book_loans").select("id", { count: "exact", head: true }).eq("book_id", book_id).is("returned_on", null),
  ]);
  if (!book || (count ?? 0) >= book.copies) throw new Error("No copies available.");
  await supabase.from("book_loans").insert({ book_id, student_id, issued_by: user?.id });
  revalidatePath("/library");
}

export async function returnBook(fd: FormData) {
  const supabase = await createClient();
  await supabase.from("book_loans").update({ returned_on: new Date().toISOString().slice(0, 10) }).eq("id", String(fd.get("id")));
  revalidatePath("/library");
}

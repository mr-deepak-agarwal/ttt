import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Table, LinkButton } from "@/components/ui";

export const dynamic = "force-dynamic";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function Batches() {
  const supabase = await createClient();
  const { data } = await supabase.from("batches")
    .select("id, name, class_mode, weekdays, start_time, end_time, room, capacity, courses(name), teachers(full_name), enrollments(count)")
    .eq("active", true).order("name");
  return (
    <>
      <PageHeader title="Batches" subtitle="Classes, teachers and timetable."
        action={<LinkButton href="/batches/new"><Plus className="h-4 w-4" /> New batch</LinkButton>} />
      <Table head={["Batch", "Course", "Teacher", "Schedule", "Room", "Students"]} empty={data?.length ? undefined : "No batches yet."}>
        {(data ?? []).map((b: any) => (
          <tr key={b.id}>
            <td className="td font-medium">{b.name} <span className="ml-1 text-xs capitalize text-ink-mute">{b.class_mode}</span></td>
            <td className="td text-ink-soft">{b.courses?.name}</td>
            <td className="td text-ink-soft">{b.teachers?.full_name ?? "—"}</td>
            <td className="td text-ink-soft">{(b.weekdays as number[]).map((d) => DAYS[d]).join(", ") || "—"}{b.start_time && ` · ${b.start_time.slice(0, 5)}–${b.end_time?.slice(0, 5) ?? ""}`}</td>
            <td className="td text-ink-soft">{b.room ?? "—"}</td>
            <td className="td">{b.enrollments?.[0]?.count ?? 0}{b.capacity ? ` / ${b.capacity}` : ""}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}

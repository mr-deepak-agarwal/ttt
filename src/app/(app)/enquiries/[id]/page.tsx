import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, Badge, statusTone } from "@/components/ui";
import { PersonFields } from "@/components/person-fields";
import { admitFromEnquiry, closeEnquiry } from "../actions";
import { fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function EnquiryDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: e } = await supabase.from("enquiries").select("*").eq("id", id).single();
  if (!e) notFound();
  const open = e.status === "open";

  return (
    <>
      <PageHeader title={e.full_name} subtitle={`Enquiry #${e.enquiry_no} · ${fmtDate(e.created_at)}`}
        action={<Badge tone={statusTone(e.status) as never}>{e.status}</Badge>} />
      {open ? (
        <form action={admitFromEnquiry} className="card max-w-3xl space-y-5 p-6">
          <input type="hidden" name="enquiry_id" value={e.id} />
          <p className="rounded-xl bg-brand-soft px-4 py-3 text-sm text-brand">
            Review the details, then admit. The student number and opening invoice are created automatically.
          </p>
          <PersonFields v={e} withDob />
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Lessons per week</label><input name="lessons_per_week" type="number" min={1} defaultValue={4} className="input" /></div>
            <div><label className="label">Indoor / Outdoor</label>
              <select name="indoor_outdoor" className="input"><option>Indoor</option><option>Outdoor</option></select></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-primary">Admit student</button>
            <button formAction={closeEnquiry} className="btn-danger" formNoValidate>Close enquiry</button>
          </div>
        </form>
      ) : (
        <div className="card max-w-3xl p-6 text-sm text-ink-soft">
          This enquiry is {e.status}. {e.phone && <>Phone: {e.phone}. </>}{e.instrument && <>Interested in {e.instrument}.</>}
        </div>
      )}
    </>
  );
}

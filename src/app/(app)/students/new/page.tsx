import { PageHeader } from "@/components/ui";
import { PersonFields } from "@/components/person-fields";
import { admitDirect } from "../actions";

export default function DirectAdmission() {
  return (
    <>
      <PageHeader title="Direct admission" subtitle="For students who join without an enquiry." />
      <form action={admitDirect} className="card max-w-3xl space-y-5 p-6">
        <PersonFields withDob />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Lessons per week</label><input name="lessons_per_week" type="number" min={1} defaultValue={4} className="input" /></div>
          <div><label className="label">Indoor / Outdoor</label>
            <select name="indoor_outdoor" className="input"><option>Indoor</option><option>Outdoor</option></select></div>
        </div>
        <button className="btn-primary">Admit student</button>
      </form>
    </>
  );
}

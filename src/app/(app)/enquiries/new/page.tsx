import { PageHeader } from "@/components/ui";
import { PersonFields } from "@/components/person-fields";
import { createEnquiry } from "../actions";

export default function NewEnquiry() {
  return (
    <>
      <PageHeader title="New enquiry" />
      <form action={createEnquiry} className="card max-w-3xl space-y-5 p-6">
        <PersonFields />
        <div><label className="label">Remarks</label><textarea name="remarks" rows={2} className="input" /></div>
        <div className="flex gap-2"><button className="btn-primary">Save enquiry</button></div>
      </form>
    </>
  );
}

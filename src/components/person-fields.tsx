import { Field } from "./ui";

type V = Record<string, any>;
const inp = (name: string, v: V, extra: object = {}) => (
  <input name={name} defaultValue={v[name] ?? ""} className="input" {...extra} />
);

export function PersonFields({ v = {}, withDob = false }: { v?: V; withDob?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name *" className="sm:col-span-2">{inp("full_name", v, { required: true })}</Field>
      {withDob ? <Field label="Date of birth">{inp("dob", v, { type: "date" })}</Field>
               : <Field label="Age">{inp("age", v, { type: "number", min: 1 })}</Field>}
      <Field label="Qualification">{inp("qualification", v)}</Field>
      <Field label="Address" className="sm:col-span-2"><textarea name="address" defaultValue={v.address ?? ""} rows={2} className="input" /></Field>
      <Field label="Working / Studying">
        <select name="work_or_study" defaultValue={v.work_or_study ?? "Studying"} className="input">
          <option>Studying</option><option>Working</option><option>Other</option>
        </select>
      </Field>
      <Field label="Guardian name">{inp("guardian_name", v)}</Field>
      <Field label="Relation">{inp("guardian_relation", v)}</Field>
      <Field label="Phone">{inp("phone", v, { inputMode: "tel" })}</Field>
      <Field label="WhatsApp">{inp("whatsapp", v, { inputMode: "tel" })}</Field>
      <Field label="Email">{inp("email", v, { type: "email" })}</Field>
      <Field label="Instrument / Course">{inp("instrument", v, { placeholder: "Piano, Guitar, Kathak…" })}</Field>
      <Field label="Prior knowledge">{inp("prior_knowledge", v)}</Field>
      <Field label="Course type">
        <select name="course_type" defaultValue={v.course_type ?? "regular"} className="input">
          <option value="regular">Regular</option><option value="crash_course">Crash course</option>
        </select>
      </Field>
      <Field label="Class mode">
        <select name="class_mode" defaultValue={v.class_mode ?? "individual"} className="input">
          <option value="individual">Individual</option><option value="group">Group</option>
        </select>
      </Field>
    </div>
  );
}

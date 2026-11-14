import { str } from "./format";

/** Fields shared by enquiries and students, read from a form. */
export function personFromForm(fd: FormData) {
  return {
    full_name: str(fd, "full_name") ?? "",
    address: str(fd, "address"),
    qualification: str(fd, "qualification"),
    work_or_study: str(fd, "work_or_study"),
    guardian_name: str(fd, "guardian_name"),
    guardian_relation: str(fd, "guardian_relation"),
    phone: str(fd, "phone"),
    whatsapp: str(fd, "whatsapp"),
    email: str(fd, "email"),
    instrument: str(fd, "instrument"),
    prior_knowledge: str(fd, "prior_knowledge"),
    course_type: (str(fd, "course_type") ?? "regular") as "regular" | "crash_course",
    class_mode: (str(fd, "class_mode") ?? "individual") as "individual" | "group",
  };
}

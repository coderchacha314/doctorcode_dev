import { redirect } from "next/navigation";

export default function MetricsPage(): never {
  redirect("/metrics/blood-sugar");
}

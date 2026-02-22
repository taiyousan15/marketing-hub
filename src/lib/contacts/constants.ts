import { LifecycleStage } from "@prisma/client";

export const LIFECYCLE_STAGES: { value: LifecycleStage; label: string; color: string }[] = [
  { value: "SUBSCRIBER", label: "購読者", color: "bg-gray-100 text-gray-700" },
  { value: "LEAD", label: "リード", color: "bg-blue-100 text-blue-700" },
  { value: "MQL", label: "MQL", color: "bg-indigo-100 text-indigo-700" },
  { value: "SQL", label: "SQL", color: "bg-violet-100 text-violet-700" },
  { value: "OPPORTUNITY", label: "商談中", color: "bg-amber-100 text-amber-700" },
  { value: "CUSTOMER", label: "顧客", color: "bg-green-100 text-green-700" },
  { value: "EVANGELIST", label: "推薦者", color: "bg-rose-100 text-rose-700" },
];

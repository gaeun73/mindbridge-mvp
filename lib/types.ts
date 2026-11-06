export type Report = {
  title: string;
  situation: string;
  emotions: { name: string; intensity: number }[];
  automatic_thought: string;
  distortions: { name: string; description: string; evidence: string }[];
  alternative_thought: string;
  small_action: string;
  mindfulness: string;
  risk_level: "none" | "low" | "high";
};

export type SavedReport = {
  id: string;
  conversation_id: string;
  title: string;
  content: Report;
  created_at: string;
};

export function formatDate(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

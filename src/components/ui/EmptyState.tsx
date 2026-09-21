import { Search } from "lucide-react";

export interface EmptyStateProps {
  title: string;
  text: string;
}

export function EmptyState({ title, text }: EmptyStateProps) {
  return <div className="empty-state"><div className="empty-icon"><Search size={25} /></div><h3>{title}</h3><p>{text}</p></div>;
}

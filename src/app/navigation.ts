import { FileText, LayoutDashboard, MessageSquareText, Settings } from "lucide-react";
import { navLabels } from "../mockData";

export type View = keyof typeof navLabels;

export const navItems = [
  { id: "overview" as View, icon: LayoutDashboard },
  { id: "reviews" as View, icon: MessageSquareText },
  { id: "posts" as View, icon: FileText },
  { id: "settings" as View, icon: Settings },
];

import type { CSSProperties } from "react";
import { Check, ChevronDown, CircleGauge, MessageSquareText, Star, TrendingUp } from "lucide-react";
import type { View } from "../app/navigation";
import { LocationMark } from "../components/ui/LocationMark";
import { Stars } from "../components/ui/Stars";
import { deriveStats, formatHebrewDate, type Location as BusinessLocation, type Review } from "../mockData";
import type { OverviewStats, SessionUser } from "../services/reviewsManager";

export interface OverviewPageProps {
  reviews: Review[];
  stats: OverviewStats;
  locations: BusinessLocation[];
  selectedLocation: string;
  user: SessionUser;
  onNavigate: (view: View) => void;
}

export function OverviewPage({ reviews, stats, locations, selectedLocation, user, onNavigate }: OverviewPageProps) {
  const sample = deriveStats(reviews);
  const positivePercent = sample.total ? Math.round(sample.positive / sample.total * 100) : 0;
  const selectedName = selectedLocation === "all" ? "כל הלקוחות" : locations.find((item) => item.id === selectedLocation)?.name;
  const firstName = user.displayName.split(/\s+/)[0] || user.displayName;
  const cards = [
    { label: "סה״כ ביקורות", value: String(stats.totalReviews), note: "כל הביקורות במערכת", icon: MessageSquareText, tone: "violet" },
    { label: "דירוג ממוצע", value: stats.averageRating.toFixed(1), suffix: "★", note: "ממוצע Google", icon: Star, tone: "amber" },
    { label: "שיעור מענה", value: `${stats.responseRate}%`, note: "מתוך כלל הביקורות", icon: TrendingUp, tone: "emerald" },
    { label: "ממתינות לאישור", value: String(stats.pendingApprovalCount), note: "דורשות את תשומת ליבך", icon: CircleGauge, tone: "rose", action: true },
  ];

  return <div className="view-stack">
    <div className="page-heading"><div><p className="eyebrow">תמונת מצב · {selectedName}</p><h1>בוקר טוב, {firstName} 👋</h1><p>הנה מה שקורה עם המוניטין של הלקוחות שלך היום.</p></div><button className="primary-button" onClick={() => onNavigate("reviews")}><MessageSquareText size={18} /> מעבר לביקורות</button></div>
    <div className="stats-grid">{cards.map(({ label, value, suffix, note, icon: Icon, tone, action }) => <button key={label} className={`stat-card ${action ? "stat-action" : ""}`} onClick={() => action && onNavigate("reviews")} disabled={!action}><span className={`stat-icon ${tone}`}><Icon size={19} /></span><span className="stat-label">{label}</span><strong>{value} {suffix && <em>{suffix}</em>}</strong><small>{note}</small></button>)}</div>
    <div className="overview-grid">
      <section className="panel sentiment-panel"><div className="panel-heading"><div><h2>שביעות רצון במדגם</h2><p>חלוקת הביקורות שנטענו כרגע</p></div><span className="period-chip">{reviews.length} אחרונות <ChevronDown size={14} /></span></div><div className="sentiment-content"><div className="donut" style={{ "--positive": `${positivePercent * 3.6}deg` } as CSSProperties}><div><strong>{positivePercent}%</strong><span>חיוביות</span></div></div><div className="legend"><div><span className="legend-dot positive" /><p><strong>{sample.positive}</strong> ביקורות חיוביות</p><b>{positivePercent}%</b></div><div><span className="legend-dot negative" /><p><strong>{sample.negative}</strong> ביקורות לשיפור</p><b>{sample.total ? 100 - positivePercent : 0}%</b></div></div></div></section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>פעילות אחרונה</h2><p>הביקורות האחרונות שנטענו</p></div><button className="text-button" onClick={() => onNavigate("reviews")}>לכל הביקורות</button></div><div className="activity-list">{reviews.slice(0, 3).map((review) => <div className="activity-row" key={review.id}><LocationMark locationId={review.locationId} locations={locations} compact /><div><p><strong>{review.customerName}</strong> השאיר/ה ביקורת</p><span><Stars rating={review.rating} size={13} /> · {formatHebrewDate(review.date)}</span></div>{review.status === "pending" ? <span className="status-pill pending">ממתין</span> : <span className="status-pill sent"><Check size={13} /> בטיפול</span>}</div>)}</div></section>
    </div>
  </div>;
}

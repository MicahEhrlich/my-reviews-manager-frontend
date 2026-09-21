import { Clock3, Pencil, Search, Send, Sparkles, Trash2, WandSparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { LocationMark } from "../components/ui/LocationMark";
import { Stars } from "../components/ui/Stars";
import { formatHebrewDate, type Location as BusinessLocation, type Review, type ReviewStatus } from "../mockData";

type ReviewFilter = "all" | "pending" | "positive" | "negative";

export interface ReviewsPageProps {
  reviews: Review[];
  locations: BusinessLocation[];
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  onApprove: (id: string) => void;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
  busy: Set<string>;
}

function reviewStatus(status: ReviewStatus) {
  const labels: Record<ReviewStatus, string> = { queued: "בתור לעיבוד", processing: "יוצר תגובה", pending: "ממתין לאישור", approving: "נשלח ל-Google", "auto-sent": "נשלח אוטומטית", approved: "אושר ונשלח", failed: "הטיפול נכשל" };
  return labels[status];
}

export function ReviewsPage({ reviews, locations, nextCursor, loadingMore, onLoadMore, onApprove, onEdit, onDelete, busy }: ReviewsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get("filter");
  const filter = (["pending", "positive", "negative"].includes(rawFilter ?? "") ? rawFilter : "all") as ReviewFilter;
  const query = searchParams.get("q") ?? "";
  const updateSearch = (key: "filter" | "q", value: string) => { const next = new URLSearchParams(searchParams); if (!value || value === "all") next.delete(key); else next.set(key, value); setSearchParams(next); };
  const counts = { all: reviews.length, pending: reviews.filter((review) => review.status === "pending").length, positive: reviews.filter((review) => review.rating >= 4).length, negative: reviews.filter((review) => review.rating <= 3).length };
  const filtered = reviews.filter((review) => {
    const matchesFilter = filter === "all" || (filter === "pending" && review.status === "pending") || (filter === "positive" && review.rating >= 4) || (filter === "negative" && review.rating <= 3);
    const businessName = locations.find((item) => item.id === review.locationId)?.name ?? "";
    return matchesFilter && `${review.customerName} ${review.text} ${businessName}`.includes(query.trim());
  });
  const tabs: { id: ReviewFilter; label: string }[] = [{ id: "all", label: "הכל" }, { id: "pending", label: "ממתין לאישור" }, { id: "positive", label: "חיובי" }, { id: "negative", label: "שלילי" }];

  return <div className="view-stack"><div className="page-heading"><div><p className="eyebrow">מרכז המוניטין</p><h1>ניהול ביקורות</h1><p>כל הביקורות והתגובות החכמות במקום אחד.</p></div><div className="heading-badge"><Sparkles size={17} /> {counts.pending} תגובות ממתינות בתוצאות שנטענו</div></div><div className="review-toolbar"><div className="tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={filter === tab.id} onClick={() => updateSearch("filter", tab.id)} className={filter === tab.id ? "active" : ""}>{tab.label}<span>{counts[tab.id]}</span></button>)}</div><label className="search-box"><Search size={17} /><span className="sr-only">חיפוש ביקורות</span><input value={query} onChange={(event) => updateSearch("q", event.target.value)} placeholder="חיפוש לפי שם או תוכן..." /></label></div>
    <div className="review-list">{filtered.length ? filtered.map((review) => { const business = locations.find((item) => item.id === review.locationId); const pending = review.status === "pending"; const stateClass = pending || review.status === "failed" ? "pending" : "sent"; return <article className={`review-card ${pending ? "needs-attention" : ""}`} key={review.id}><div className="review-top"><div className="reviewer"><span className="avatar" style={{ background: `${business?.color ?? "#725CF2"}18`, color: business?.color }}>{review.customerName.charAt(0)}</span><div><strong>{review.customerName}</strong><span><Stars rating={review.rating} /><b>{review.rating}.0</b></span></div></div><div className="review-meta"><span>{formatHebrewDate(review.date)}</span><LocationMark locationId={review.locationId} locations={locations} /></div></div><p className="review-text">“{review.text}”</p><div className="ai-response"><div className="ai-response-title"><span><WandSparkles size={16} /> תגובת AI</span><span className={`status-pill ${stateClass}`}><Clock3 size={13} />{reviewStatus(review.status)}</span></div><p>{review.aiResponse || (review.status === "failed" ? "לא נוצרה תגובה. נסו שוב מאוחר יותר." : "התגובה עדיין נוצרת.")}</p></div>{pending && <div className="review-actions"><button className="primary-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onApprove(review.id)}><Send size={16} /> אישור ושליחה</button><button className="secondary-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onEdit(review)}><Pencil size={15} /> עריכה</button><button className="danger-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onDelete(review)}><Trash2 size={15} /> מחיקה</button></div>}</article>; }) : <EmptyState title="לא נמצאו ביקורות" text="נסו לשנות את הסינון או את מילות החיפוש." />}</div>
    {nextCursor && <button className="secondary-button load-more" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "טוענים..." : "טעינת ביקורות נוספות"}</button>}
  </div>;
}

import { useState, type FormEvent } from "react";
import { CalendarClock, ImagePlus, RefreshCw, Send } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { LocationMark } from "../components/ui/LocationMark";
import { Switch } from "../components/ui/Switch";
import { formatHebrewDate, postStatusLabels, postTypeLabels, type GooglePost, type Location as BusinessLocation } from "../mockData";
import type { CreatePostInput } from "../services/reviewsManager";

export interface PostsPageProps {
  posts: GooglePost[];
  locations: BusinessLocation[];
  selectedLocation: string;
  nextCursor: string | null;
  loadingMore: boolean;
  onLoadMore: () => void;
  onCreate: (input: CreatePostInput) => Promise<boolean>;
  onToggleStatus: (post: GooglePost) => Promise<void>;
  onRetry: (post: GooglePost) => Promise<void>;
}

const frequencies = [3, 5, 7, 14] as const;

export function PostsPage({ posts, locations, selectedLocation, nextCursor, loadingMore, onLoadMore, onCreate, onToggleStatus, onRetry }: PostsPageProps) {
  const initialLocation = selectedLocation === "all" ? locations[0]?.id ?? "" : selectedLocation;
  const [form, setForm] = useState({ locationId: initialLocation, brief: "", schedule: "now" as "now" | "later", publishAt: "", autoRenew: true, frequencyDays: 7 as CreatePostInput["frequencyDays"] });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const brief = form.brief.trim();
    if (brief.length < 10) return setError("הבריף חייב להכיל לפחות 10 תווים.");
    if (form.schedule === "later" && !form.publishAt) return setError("יש לבחור מועד לפרסום.");
    const date = form.schedule === "later" ? new Date(form.publishAt) : null;
    if (date && (Number.isNaN(date.getTime()) || date.getTime() <= Date.now())) return setError("יש לבחור מועד עתידי לפרסום.");
    setSubmitting(true);
    const created = await onCreate({ locationId: form.locationId, brief, publishAt: date?.toISOString(), autoRenew: form.autoRenew, frequencyDays: form.frequencyDays });
    setSubmitting(false);
    if (created) { setForm((current) => ({ ...current, brief: "", publishAt: "", schedule: "now" })); setError(""); }
  };

  return <div className="view-stack"><div className="page-heading"><div><p className="eyebrow">תוכן מקומי</p><h1>פוסטים בגוגל</h1><p>כתבו בריף קצר, וה-AI ייצור ויפרסם ממנו תוכן בעברית.</p></div></div><div className="posts-layout"><form className="panel post-form" onSubmit={submit}><div className="panel-heading"><div><h2>יצירת פוסט חדש</h2><p>הטקסט ייווצר אוטומטית מהבריף ומהקשר העסקי</p></div><span className="draft-pill">AI</span></div>
    <label><span className="field-label">בחירת עסק</span><select value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}>{locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
    <label><span className="field-label">בריף לפוסט</span><textarea rows={6} minLength={10} maxLength={1000} required value={form.brief} onChange={(event) => { setForm({ ...form, brief: event.target.value }); setError(""); }} placeholder="לדוגמה: ספרו על התפריט החדש, בלי לציין מחיר" /><span className="character-count">{form.brief.length}/1,000</span></label>
    <div className="form-grid"><label><span className="field-label">מועד פרסום</span><select value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value as "now" | "later" })}><option value="now">פרסום עכשיו</option><option value="later">תזמון למועד אחר</option></select></label>{form.schedule === "later" && <label><span className="field-label">תאריך ושעה</span><input className="post-date-input" type="datetime-local" value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} /></label>}</div>
    <div className="renew-box"><div><span className="renew-icon"><CalendarClock size={20} /></span><div><strong>פרסום חוזר עם טקסט חדש</strong><p>בכל פעם ה-AI יכתוב נוסח חדש מאותו בריף</p></div></div><Switch checked={form.autoRenew} onChange={(value) => setForm({ ...form, autoRenew: value })} label="פרסום חוזר" /></div>
    {form.autoRenew && <label><span className="field-label">תדירות הפרסום החוזר</span><select value={form.frequencyDays} onChange={(event) => setForm({ ...form, frequencyDays: Number(event.target.value) as CreatePostInput["frequencyDays"] })}>{frequencies.map((days) => <option value={days} key={days}>כל {days} ימים</option>)}</select></label>}
    {error && <p className="field-error" role="alert">{error}</p>}<button className="primary-button submit-post" type="submit" disabled={submitting || !form.locationId}><Send size={17} /> {submitting ? "יוצרים ומתזמנים..." : "יצירה ופרסום"}</button></form>
    <section className="panel active-posts"><div className="panel-heading"><div><h2>פוסטים</h2><p>{posts.length} פוסטים נטענו</p></div></div><div className="post-list">{posts.length ? posts.map((post) => { const toggleable = post.status === "published" || post.status === "paused"; return <article className="post-card" key={post.id}>{post.imageUrl ? <img className="post-thumb" src={post.imageUrl} alt="" /> : <div className={`post-thumb placeholder ${post.type}`}><ImagePlus size={22} /></div>}<div className="post-main"><div className="post-card-top"><LocationMark locationId={post.locationId} locations={locations} /><span className={`status-pill ${post.status === "paused" || post.status === "failed" ? "pending" : "sent"}`}>{postStatusLabels[post.status]}</span></div><p>{post.text || (post.status === "generating" ? "הטקסט נכתב כעת…" : "ממתין ליצירת טקסט…")}</p>{post.failureMessage && <p className="field-error">{post.failureMessage}</p>}<div className="post-footer"><span>{postTypeLabels[post.type]}{post.publishedAt ? ` · ${formatHebrewDate(post.publishedAt)}` : post.nextPublishAt ? ` · מתוזמן ל-${formatHebrewDate(post.nextPublishAt)}` : ""}</span>{post.autoRenew && <span className="renew-label"><CalendarClock size={13} /> כל {post.frequencyDays ?? 7} ימים</span>}</div></div>{post.status === "failed" ? <button className="secondary-button post-retry" type="button" onClick={() => void onRetry(post)}><RefreshCw size={14} /> ניסיון חוזר</button> : <Switch checked={post.status === "published" || post.status === "publishing" || post.status === "generating" || post.status === "scheduled"} disabled={!toggleable} onChange={() => void onToggleStatus(post)} label={`שינוי סטטוס לפוסט של ${locations.find((item) => item.id === post.locationId)?.name ?? "העסק"}`} />}</article>; }) : <EmptyState title="אין פוסטים להצגה" text="צרו את הפוסט הראשון לעסק הזה." />}</div>{nextCursor && <button className="secondary-button load-more" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "טוענים..." : "טעינת פוסטים נוספים"}</button>}</section></div></div>;
}

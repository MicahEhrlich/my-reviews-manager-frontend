import { useState, type FormEvent } from "react";
import { CalendarClock, ImagePlus, Send, UploadCloud } from "lucide-react";
import { EmptyState } from "../components/ui/EmptyState";
import { LocationMark } from "../components/ui/LocationMark";
import { Switch } from "../components/ui/Switch";
import {
  formatHebrewDate,
  postStatusLabels,
  postTypeLabels,
  type GooglePost,
  type Location as BusinessLocation,
  type PostType,
} from "../mockData";
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
}

export function PostsPage({ posts, locations, selectedLocation, nextCursor, loadingMore, onLoadMore, onCreate, onToggleStatus }: PostsPageProps) {
  const initialLocation = selectedLocation === "all" ? locations[0]?.id ?? "" : selectedLocation;
  const [form, setForm] = useState({ locationId: initialLocation, type: "update" as PostType, text: "", autoRenew: true });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (form.text.trim().length < 10) return setError("כדאי לכתוב לפחות 10 תווים כדי ליצור פוסט ברור.");
    setSubmitting(true);
    const created = await onCreate({ ...form, text: form.text.trim() });
    setSubmitting(false);
    if (created) {
      setForm((current) => ({ ...current, text: "" }));
      setError("");
    }
  };

  return <div className="view-stack"><div className="page-heading"><div><p className="eyebrow">תוכן מקומי</p><h1>פוסטים בגוגל</h1><p>צרו וחדשו תוכן בכל פרופילי העסק.</p></div></div><div className="posts-layout"><form className="panel post-form" onSubmit={submit}><div className="panel-heading"><div><h2>יצירת פוסט חדש</h2><p>הפוסט יישלח לפרסום בפרופיל העסק</p></div><span className="draft-pill">טיוטה חדשה</span></div><div className="form-grid"><label><span className="field-label">בחירת עסק</span><select value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}>{locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label><span className="field-label">סוג הפוסט</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PostType })}>{Object.entries(postTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div><label><span className="field-label">תוכן הפוסט</span><textarea rows={6} maxLength={1500} value={form.text} onChange={(event) => { setForm({ ...form, text: event.target.value }); setError(""); }} placeholder="מה חדש בעסק? ספרו ללקוחות שלכם..." /><span className="character-count">{form.text.length}/1,500</span></label>{error && <p className="field-error" role="alert">{error}</p>}<div className="upload-zone disabled" aria-disabled="true"><span><UploadCloud size={24} /></span><strong>הוספת תמונה אינה זמינה כרגע</strong><small>ה-API הקיים עדיין אינו תומך בפרסום מדיה</small></div><div className="renew-box"><div><span className="renew-icon"><CalendarClock size={20} /></span><div><strong>חידוש אוטומטי כל 6 ימים</strong><p>נפרסם מחדש לפני שהפוסט יוסר מגוגל</p></div></div><Switch checked={form.autoRenew} onChange={(value) => setForm({ ...form, autoRenew: value })} label="חידוש אוטומטי" /></div><button className="primary-button submit-post" type="submit" disabled={submitting || !form.locationId}><Send size={17} /> {submitting ? "שולחים..." : "פרסום עכשיו"}</button></form>
    <section className="panel active-posts"><div className="panel-heading"><div><h2>פוסטים</h2><p>{posts.length} פוסטים נטענו</p></div></div><div className="post-list">{posts.length ? posts.map((post) => { const toggleable = post.status === "published" || post.status === "paused"; return <article className="post-card" key={post.id}><div className={`post-thumb placeholder ${post.type}`}><ImagePlus size={22} /></div><div className="post-main"><div className="post-card-top"><LocationMark locationId={post.locationId} locations={locations} /><span className={`status-pill ${post.status === "paused" || post.status === "failed" ? "pending" : "sent"}`}>{postStatusLabels[post.status]}</span></div><p>{post.text}</p><div className="post-footer"><span>{postTypeLabels[post.type]}{post.publishedAt ? ` · ${formatHebrewDate(post.publishedAt)}` : ""}</span>{post.autoRenew && <span className="renew-label"><CalendarClock size={13} /> מתחדש אוטומטית</span>}</div></div><Switch checked={post.status === "published" || post.status === "publishing" || post.status === "scheduled"} disabled={!toggleable} onChange={() => void onToggleStatus(post)} label={`שינוי סטטוס לפוסט של ${locations.find((item) => item.id === post.locationId)?.name ?? "העסק"}`} /></article>; }) : <EmptyState title="אין פוסטים להצגה" text="צרו את הפוסט הראשון לעסק הזה." />}</div>{nextCursor && <button className="secondary-button load-more" disabled={loadingMore} onClick={onLoadMore}>{loadingMore ? "טוענים..." : "טעינת פוסטים נוספים"}</button>}</section></div></div>;
}

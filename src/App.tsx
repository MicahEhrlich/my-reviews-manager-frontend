import { useEffect, useMemo, useRef, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  Bell, Building2, CalendarClock, Check, CheckCircle2, ChevronDown, CircleGauge,
  Clock3, FileText, ImagePlus, LayoutDashboard, Menu, MessageSquareText, Moon,
  MoreHorizontal, Pencil, Search, Send, Settings, Sparkles, Star, Sun,
  Trash2, TrendingUp, UploadCloud, WandSparkles, X,
} from "lucide-react";
import {
  deriveStats, formatHebrewDate, locations, navLabels, postStatusLabels, postTypeLabels, toneLabels,
  type GooglePost, type LocationSettings, type PostType, type Review, type Theme, type Tone,
} from "./mockData";
import type { CreatePostInput, ReviewsManagerService } from "./services/reviewsManager";

type View = keyof typeof navLabels;
type ReviewFilter = "all" | "pending" | "positive" | "negative";

const navItems = [
  { id: "overview" as View, icon: LayoutDashboard },
  { id: "reviews" as View, icon: MessageSquareText },
  { id: "posts" as View, icon: FileText },
  { id: "settings" as View, icon: Settings },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`switch ${checked ? "switch-on" : ""}`}>
      <span />
    </button>
  );
}

function Stars({ rating, size = 16 }: { rating: number; size?: number }) {
  return <span className="stars" aria-label={`${rating} מתוך 5 כוכבים`} dir="ltr">
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} fill={star <= rating ? "currentColor" : "none"} />)}
  </span>;
}

function LocationMark({ locationId, compact = false }: { locationId: string; compact?: boolean }) {
  const location = locations.find((item) => item.id === locationId)!;
  return <span className={`location-mark ${compact ? "compact" : ""}`}>
    <span className="location-dot" style={{ background: location.color }}>{location.name.charAt(0)}</span>
    {!compact && <span><strong>{location.name}</strong><small>{location.category} · {location.city}</small></span>}
  </span>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon"><Search size={25} /></div><h3>{title}</h3><p>{text}</p></div>;
}

function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const dark = theme === "dark";
  return <button className="icon-button theme-toggle" onClick={onToggle} aria-label={dark ? "מעבר למצב בהיר" : "מעבר למצב כהה"} title={dark ? "מצב בהיר" : "מצב כהה"}>
    {dark ? <Sun size={19} /> : <Moon size={19} />}
  </button>;
}

function Overview({ reviews, selectedLocation, onNavigate }: { reviews: Review[]; selectedLocation: string; onNavigate: (view: View) => void }) {
  const stats = deriveStats(reviews);
  const selectedName = selectedLocation === "all" ? "כל הלקוחות" : locations.find((item) => item.id === selectedLocation)?.name;
  const positivePercent = stats.total ? Math.round(stats.positive / stats.total * 100) : 0;
  const cards = [
    { label: "סה״כ ביקורות", value: String(stats.total), note: "+12% מהחודש שעבר", icon: MessageSquareText, tone: "violet" },
    { label: "דירוג ממוצע", value: stats.average.toFixed(1), suffix: "★", note: "ממוצע Google", icon: Star, tone: "amber" },
    { label: "שיעור מענה", value: `${stats.responseRate}%`, note: `${stats.total - stats.pending} ביקורות נענו`, icon: TrendingUp, tone: "emerald" },
    { label: "זמן תגובה ממוצע", value: stats.averageMinutes ? `${stats.averageMinutes} דק׳` : "—", note: "מהיר מהממוצע", icon: Clock3, tone: "blue" },
    { label: "ממתינות לאישור", value: String(stats.pending), note: "דורשות את תשומת ליבך", icon: CircleGauge, tone: "rose", action: true },
  ];
  return <div className="view-stack">
    <div className="page-heading"><div><p className="eyebrow">תמונת מצב · {selectedName}</p><h1>בוקר טוב, מיכל 👋</h1><p>הנה מה שקורה עם המוניטין של הלקוחות שלך היום.</p></div><button className="primary-button" onClick={() => onNavigate("reviews")}><MessageSquareText size={18} /> מעבר לביקורות</button></div>
    <div className="stats-grid">
      {cards.map(({ label, value, suffix, note, icon: Icon, tone, action }) => <button key={label} className={`stat-card ${action ? "stat-action" : ""}`} onClick={() => action && onNavigate("reviews")} disabled={!action}>
        <span className={`stat-icon ${tone}`}><Icon size={19} /></span><span className="stat-label">{label}</span><strong>{value} {suffix && <em>{suffix}</em>}</strong><small>{note}</small>
      </button>)}
    </div>
    <div className="overview-grid">
      <section className="panel sentiment-panel"><div className="panel-heading"><div><h2>מגמת שביעות רצון</h2><p>חלוקת הביקורות לפי סנטימנט</p></div><span className="period-chip">30 ימים אחרונים <ChevronDown size={14} /></span></div>
        <div className="sentiment-content">
          <div className="donut" style={{ "--positive": `${positivePercent * 3.6}deg` } as React.CSSProperties}><div><strong>{positivePercent}%</strong><span>חיוביות</span></div></div>
          <div className="legend"><div><span className="legend-dot positive"/><p><strong>{stats.positive}</strong> ביקורות חיוביות</p><b>{positivePercent}%</b></div><div><span className="legend-dot negative"/><p><strong>{stats.negative}</strong> ביקורות לשיפור</p><b>{100 - positivePercent}%</b></div></div>
        </div>
      </section>
      <section className="panel activity-panel"><div className="panel-heading"><div><h2>פעילות אחרונה</h2><p>עדכונים בזמן אמת</p></div><button className="text-button" onClick={() => onNavigate("reviews")}>לכל הביקורות</button></div>
        <div className="activity-list">
          {reviews.slice(0, 3).map((review) => <div className="activity-row" key={review.id}><LocationMark locationId={review.locationId} compact /><div><p><strong>{review.customerName}</strong> השאיר/ה ביקורת</p><span><Stars rating={review.rating} size={13} /> · {formatHebrewDate(review.date)}</span></div>{review.status === "pending" ? <span className="status-pill pending">ממתין</span> : <span className="status-pill sent"><Check size={13}/> נענה</span>}</div>)}
        </div>
      </section>
    </div>
    <section className="insight-banner"><span className="insight-icon"><Sparkles size={22}/></span><div><strong>תובנה חכמה</strong><p>עסקים שמגיבים לביקורות בתוך 10 דקות מקבלים בממוצע יותר אינטראקציות בפרופיל.</p></div><button onClick={() => onNavigate("reviews")}>טיפול בביקורות <span aria-hidden>←</span></button></section>
  </div>;
}

function EditModal({ review, onClose, onSave }: { review: Review; onClose: () => void; onSave: (text: string, approve: boolean) => void }) {
  const [text, setText] = useState(review.aiResponse);
  const [error, setError] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { closeRef.current?.focus(); const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose(); document.addEventListener("keydown", onKey); return () => document.removeEventListener("keydown", onKey); }, [onClose]);
  const submit = (approve: boolean) => { if (!text.trim()) return setError("יש להזין נוסח תגובה לפני השמירה"); onSave(text.trim(), approve); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
      <div className="modal-header"><div><span className="ai-kicker"><WandSparkles size={15}/> טיוטה שנוצרה בעזרת AI</span><h2 id="edit-title">עריכת תגובה</h2></div><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="סגירת חלון"><X size={19}/></button></div>
      <div className="review-context"><span className="avatar">{review.customerName.charAt(0)}</span><div><strong>{review.customerName}</strong><Stars rating={review.rating} size={13}/><p>{review.text}</p></div></div>
      <label className="field-label" htmlFor="response-text">נוסח התגובה</label><textarea id="response-text" value={text} onChange={(event) => { setText(event.target.value); setError(""); }} rows={6} aria-invalid={Boolean(error)} />
      <div className="editor-meta"><span>{text.length} תווים</span><span>טון: חם ואישי</span></div>{error && <p className="field-error" role="alert">{error}</p>}
      <div className="modal-actions"><button className="ghost-button" onClick={onClose}>ביטול</button><button className="secondary-button" onClick={() => submit(false)}>שמירת טיוטה</button><button className="primary-button" onClick={() => submit(true)}><Send size={17}/> שמירה, אישור ושליחה</button></div>
    </div>
  </div>;
}

function Reviews({ reviews, onApprove, onEdit, onDelete, busy }: { reviews: Review[]; onApprove: (id: string) => void; onEdit: (review: Review) => void; onDelete: (review: Review) => void; busy: Set<string> }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get("filter");
  const filter: ReviewFilter = ["pending", "positive", "negative"].includes(rawFilter ?? "") ? rawFilter as ReviewFilter : "all";
  const query = searchParams.get("q") ?? "";
  const updateSearch = (key: "filter" | "q", value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === "all") next.delete(key); else next.set(key, value);
    setSearchParams(next);
  };
  const counts = { all: reviews.length, pending: reviews.filter((r) => r.status === "pending").length, positive: reviews.filter((r) => r.rating >= 4).length, negative: reviews.filter((r) => r.rating <= 3).length };
  const filtered = reviews.filter((review) => {
    const matchesFilter = filter === "all" || (filter === "pending" && review.status === "pending") || (filter === "positive" && review.rating >= 4) || (filter === "negative" && review.rating <= 3);
    const matchesQuery = `${review.customerName} ${review.text} ${locations.find((l) => l.id === review.locationId)?.name}`.includes(query);
    return matchesFilter && matchesQuery;
  });
  const tabs: { id: ReviewFilter; label: string }[] = [{ id: "all", label: "הכל" }, { id: "pending", label: "ממתין לאישור" }, { id: "positive", label: "חיובי" }, { id: "negative", label: "שלילי" }];
  return <div className="view-stack">
    <div className="page-heading"><div><p className="eyebrow">מרכז המוניטין</p><h1>ניהול ביקורות</h1><p>כל הביקורות והתגובות החכמות במקום אחד.</p></div><div className="heading-badge"><Sparkles size={17}/> {counts.pending} תגובות ממתינות לך</div></div>
    <div className="review-toolbar"><div className="tabs" role="tablist">{tabs.map((tab) => <button key={tab.id} role="tab" aria-selected={filter === tab.id} onClick={() => updateSearch("filter", tab.id)} className={filter === tab.id ? "active" : ""}>{tab.label}<span>{counts[tab.id]}</span></button>)}</div><label className="search-box"><Search size={17}/><span className="sr-only">חיפוש ביקורות</span><input value={query} onChange={(event) => updateSearch("q", event.target.value)} placeholder="חיפוש לפי שם או תוכן..." /></label></div>
    <div className="review-list">{filtered.length ? filtered.map((review) => {
      const location = locations.find((item) => item.id === review.locationId)!;
      return <article className={`review-card ${review.status === "pending" ? "needs-attention" : ""}`} key={review.id}>
        <div className="review-top"><div className="reviewer"><span className="avatar" style={{ background: `${location.color}18`, color: location.color }}>{review.customerName.charAt(0)}</span><div><strong>{review.customerName}</strong><span><Stars rating={review.rating}/><b>{review.rating}.0</b></span></div></div><div className="review-meta"><span>{formatHebrewDate(review.date)}</span><LocationMark locationId={review.locationId}/><button className="icon-button more" aria-label="אפשרויות נוספות"><MoreHorizontal size={18}/></button></div></div>
        <p className="review-text">“{review.text}”</p>
        <div className="ai-response"><div className="ai-response-title"><span><WandSparkles size={16}/> תגובת AI</span>{review.status === "pending" ? <span className="status-pill pending"><Clock3 size={13}/> ממתין לאישור</span> : <span className="status-pill sent"><CheckCircle2 size={13}/> {review.status === "auto-sent" ? "נשלח אוטומטית" : "אושר ונשלח"}</span>}</div><p>{review.aiResponse}</p></div>
        {review.status === "pending" && <div className="review-actions"><button className="primary-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onApprove(review.id)}><Send size={16}/> אישור ושליחה</button><button className="secondary-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onEdit(review)}><Pencil size={15}/> עריכה</button><button className="danger-button" disabled={busy.has(`review:${review.id}`)} onClick={() => onDelete(review)}><Trash2 size={15}/> מחיקה</button></div>}
      </article>;
    }) : <EmptyState title="לא נמצאו ביקורות" text="נסו לשנות את הסינון או את מילות החיפוש." />}</div>
  </div>;
}

function Posts({ posts, selectedLocation, onCreate, onToggleStatus }: { posts: GooglePost[]; selectedLocation: string; onCreate: (input: CreatePostInput) => Promise<boolean>; onToggleStatus: (post: GooglePost) => Promise<void> }) {
  const [form, setForm] = useState({ locationId: selectedLocation === "all" ? locations[0].id : selectedLocation, type: "update" as PostType, text: "", autoRenew: true, imageUrl: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const visiblePosts = posts.filter((post) => selectedLocation === "all" || post.locationId === selectedLocation);
  const uploadImage = (file?: File) => { if (!file) return; setForm((current) => ({ ...current, imageUrl: URL.createObjectURL(file) })); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (form.text.trim().length < 10) return setError("כדאי לכתוב לפחות 10 תווים כדי ליצור פוסט ברור."); setSubmitting(true); const created = await onCreate({ locationId: form.locationId, type: form.type, text: form.text.trim(), autoRenew: form.autoRenew, imageUrl: form.imageUrl || undefined }); setSubmitting(false); if (created) { setForm((current) => ({ ...current, text: "", imageUrl: "" })); setError(""); } };
  return <div className="view-stack">
    <div className="page-heading"><div><p className="eyebrow">תוכן מקומי</p><h1>פוסטים בגוגל</h1><p>צרו, תזמנו וחדשו תוכן בכל פרופילי העסק.</p></div></div>
    <div className="posts-layout">
      <form className="panel post-form" onSubmit={submit}><div className="panel-heading"><div><h2>יצירת פוסט חדש</h2><p>הפוסט יופיע ישירות בפרופיל העסק</p></div><span className="draft-pill">טיוטה חדשה</span></div>
        <div className="form-grid"><label><span className="field-label">בחירת עסק</span><select value={form.locationId} onChange={(event) => setForm({ ...form, locationId: event.target.value })}>{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label><label><span className="field-label">סוג הפוסט</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as PostType })}>{Object.entries(postTypeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label></div>
        <label><span className="field-label">תוכן הפוסט</span><textarea rows={6} value={form.text} onChange={(event) => { setForm({ ...form, text: event.target.value }); setError(""); }} placeholder="מה חדש בעסק? ספרו ללקוחות שלכם..."/><span className="character-count">{form.text.length}/1,500</span></label>{error && <p className="field-error" role="alert">{error}</p>}
        <label className={`upload-zone ${form.imageUrl ? "has-image" : ""}`}><input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0])}/>{form.imageUrl ? <><img src={form.imageUrl} alt="תצוגה מקדימה לפוסט"/><button type="button" onClick={(event) => { event.preventDefault(); setForm({ ...form, imageUrl: "" }); }} aria-label="הסרת תמונה"><X size={17}/></button></> : <><span><UploadCloud size={24}/></span><strong>הוספת תמונה</strong><small>PNG או JPG עד 10MB</small></>}</label>
        <div className="renew-box"><div><span className="renew-icon"><CalendarClock size={20}/></span><div><strong>חידוש אוטומטי כל 6 ימים</strong><p>נפרסם מחדש לפני שהפוסט יוסר מגוגל</p></div></div><span className="tooltip-wrap"><button type="button" className="help-button" aria-label="מידע על חידוש אוטומטי">?</button><span role="tooltip">פוסט רגיל נמחק מגוגל לאחר 7 ימים — הגדרה זו תפרסם אותו מחדש באופן אוטומטי</span></span><Switch checked={form.autoRenew} onChange={(value) => setForm({ ...form, autoRenew: value })} label="חידוש אוטומטי"/></div>
        <button className="primary-button submit-post" type="submit" disabled={submitting}><Send size={17}/> {submitting ? "מפרסם..." : "פרסום עכשיו"}</button>
      </form>
      <section className="panel active-posts"><div className="panel-heading"><div><h2>פוסטים פעילים</h2><p>{visiblePosts.length} פוסטים בכל הערוצים</p></div><button className="icon-button"><MoreHorizontal size={19}/></button></div>
        <div className="post-list">{visiblePosts.length ? visiblePosts.map((post) => <article className="post-card" key={post.id}>{post.imageUrl ? <img className="post-thumb" src={post.imageUrl} alt=""/> : <div className={`post-thumb placeholder ${post.type}`}><ImagePlus size={22}/></div>}<div className="post-main"><div className="post-card-top"><LocationMark locationId={post.locationId}/><span className={`status-pill ${post.status === "paused" ? "pending" : "sent"}`}>{postStatusLabels[post.status]}</span></div><p>{post.text}</p><div className="post-footer"><span>{postTypeLabels[post.type]} · {formatHebrewDate(post.publishedAt)}</span>{post.autoRenew && <span className="renew-label"><CalendarClock size={13}/> מתחדש אוטומטית</span>}</div></div><Switch checked={post.status !== "paused"} onChange={() => void onToggleStatus(post)} label={`שינוי סטטוס לפוסט של ${locations.find((l) => l.id === post.locationId)?.name}`}/></article>) : <EmptyState title="אין פוסטים להצגה" text="צרו את הפוסט הראשון לעסק הזה."/>}</div>
      </section>
    </div>
  </div>;
}

function SettingsView({ selectedLocation, onSelectLocation, settings, onUpdate }: { selectedLocation: string; onSelectLocation: (id: string) => void; settings: Record<string, LocationSettings>; onUpdate: (locationId: string, patch: Partial<LocationSettings>) => Promise<boolean> }) {
  const [saved, setSaved] = useState(false);
  const current = selectedLocation === "all" ? null : settings[selectedLocation];
  const update = async (patch: Partial<LocationSettings>) => { if (!current) return; if (await onUpdate(selectedLocation, patch)) { setSaved(true); window.setTimeout(() => setSaved(false), 1800); } };
  return <div className="view-stack settings-page">
    <div className="page-heading"><div><p className="eyebrow">העדפות וחיבורים</p><h1>הגדרות</h1><p>התאימו את אופן הפעולה לכל אחד מהעסקים.</p></div>{saved && <span className="saved-toast"><CheckCircle2 size={16}/> השינויים נשמרו</span>}</div>
    <section className="panel connection-panel"><div className="connection-icon"><Building2 size={22}/></div><div><h2>חשבון Google Business Profile</h2><p>החשבון מחובר ומסונכרן. הסנכרון האחרון בוצע לפני 4 דקות.</p><code>business.manage</code></div><span className="connection-status"><span/> מחובר</span><button className="secondary-button">ניהול חיבור</button></section>
    <section className="panel business-settings"><div className="panel-heading"><div><h2>הגדרות תגובה לפי עסק</h2><p>לכל עסק אפשר להגדיר קול וכללי אוטומציה שונים</p></div></div>
      {selectedLocation === "all" ? <div className="location-prompt"><span><Settings size={26}/></span><h3>בחרו עסק כדי להמשיך</h3><p>ההגדרות נשמרות בנפרד לכל מיקום, כדי שהתגובות תמיד ירגישו מדויקות למותג.</p><div>{locations.map((location) => <button key={location.id} onClick={() => onSelectLocation(location.id)}><LocationMark locationId={location.id}/><span aria-hidden>←</span></button>)}</div></div> : current && <div className="settings-content"><div className="selected-business"><LocationMark locationId={selectedLocation}/><button className="text-button" onClick={() => onSelectLocation("all")}>החלפת עסק</button></div>
        <div className="setting-row"><div><span className="setting-icon"><MessageSquareText size={19}/></span><div><strong>טון התגובה של ה־AI</strong><p>הסגנון שישמש ליצירת טיוטות חדשות</p></div></div><select value={current.tone} onChange={(event) => void update({ tone: event.target.value as Tone })}>{Object.entries(toneLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div>
        <div className="setting-row"><div><span className="setting-icon"><WandSparkles size={19}/></span><div><strong>מענה אוטומטי לביקורות חיוביות</strong><p>תגובות לביקורות של 4–5 כוכבים יישלחו ללא אישור</p></div></div><Switch checked={current.autoReply} onChange={(value) => void update({ autoReply: value })} label="מענה אוטומטי לביקורות חיוביות"/></div>
        <div className="tone-preview"><span><Sparkles size={18}/></span><div><strong>כך נשמעת תגובה בסגנון “{toneLabels[current.tone]}”</strong><p>{current.tone === "warm" ? "תודה רבה על המילים החמות! שמחנו לארח אותך ומחכים כבר לפעם הבאה 💜" : current.tone === "professional" ? "תודה על המשוב החיובי. אנו שמחים שהשירות עמד בציפיותיך ונשמח לעמוד לרשותך גם בעתיד." : "תודה על המשוב! שמחנו לעזור ונשמח לראותך שוב."}</p></div></div>
      </div>}
    </section>
  </div>;
}

export default function App({ service }: { service: ReviewsManagerService }) {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLocation = searchParams.get("location") ?? "all";
  const selectedLocation = requestedLocation === "all" || locations.some((item) => item.id === requestedLocation) ? requestedLocation : "all";
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<GooglePost[]>([]);
  const [settings, setSettings] = useState<Record<string, LocationSettings>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [theme, setTheme] = useState<Theme>(() => typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const editTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    service.load().then((data) => {
      if (!active) return;
      setReviews(data.reviews);
      setPosts(data.posts);
      setSettings(data.settings);
    }).catch(() => active && setError("לא הצלחנו לטעון את נתוני המערכת. נסו לרענן את הדף.")).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [service]);
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (event: MediaQueryListEvent) => { if (!localStorage.getItem("agency-theme")) { root.classList.toggle("dark", event.matches); setTheme(event.matches ? "dark" : "light"); } };
    media.addEventListener("change", onSystemChange); return () => media.removeEventListener("change", onSystemChange);
  }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [location.pathname]);
  const toggleTheme = () => { const next = theme === "dark" ? "light" : "dark"; document.documentElement.classList.toggle("dark", next === "dark"); localStorage.setItem("agency-theme", next); setTheme(next); };
  const visibleReviews = useMemo(() => reviews.filter((review) => selectedLocation === "all" || review.locationId === selectedLocation), [reviews, selectedLocation]);
  const execute = async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    setBusy((current) => new Set(current).add(key));
    setError("");
    try { return await action(); }
    catch { setError("הפעולה לא הושלמה. נסו שוב בעוד רגע."); return undefined; }
    finally { setBusy((current) => { const next = new Set(current); next.delete(key); return next; }); }
  };
  const replaceReview = (updated: Review) => setReviews((current) => current.map((review) => review.id === updated.id ? updated : review));
  const approve = async (id: string) => { const updated = await execute(`review:${id}`, () => service.approveReview(id)); if (updated) replaceReview(updated); };
  const deleteReview = async (review: Review) => { if (!window.confirm(`למחוק את הביקורת של ${review.customerName}?`)) return; const removed = await execute(`review:${review.id}`, async () => { await service.deleteReview(review.id); return true; }); if (removed) setReviews((current) => current.filter((item) => item.id !== review.id)); };
  const openEditor = (review: Review) => { editTriggerRef.current = document.activeElement as HTMLElement; setEditing(review); };
  const closeEditor = () => { setEditing(null); requestAnimationFrame(() => editTriggerRef.current?.focus()); };
  const saveEdit = async (text: string, shouldApprove: boolean) => { if (!editing) return; const updated = await execute(`review:${editing.id}`, () => service.saveReview(editing.id, { response: text, approve: shouldApprove })); if (updated) { replaceReview(updated); closeEditor(); } };
  const routeFor = (next: View) => `/${next}?location=${selectedLocation}`;
  const navigate = (next: View) => routerNavigate(routeFor(next));
  const selectLocation = (id: string) => { const next = new URLSearchParams(searchParams); next.set("location", locations.some((item) => item.id === id) ? id : "all"); setSearchParams(next); };
  const createPost = async (input: CreatePostInput) => { const post = await execute("create-post", () => service.createPost(input)); if (!post) return false; setPosts((current) => [post, ...current]); return true; };
  const togglePostStatus = async (post: GooglePost) => { const updated = await execute(`post:${post.id}`, () => service.changePostStatus(post.id, post.status === "paused" ? "published" : "paused")); if (updated) setPosts((current) => current.map((item) => item.id === updated.id ? updated : item)); };
  const updateSettings = async (locationId: string, patch: Partial<LocationSettings>) => { const updated = await execute(`settings:${locationId}`, () => service.updateLocationSettings(locationId, patch)); if (!updated) return false; setSettings((current) => ({ ...current, [locationId]: updated })); return true; };

  if (loading) return <div className="app-loading" dir="rtl" role="status"><span className="brand-mark"><Sparkles size={22}/></span><strong>טוענים את Revu...</strong></div>;

  return <div className="dashboard-shell" dir="rtl">
    <aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="ניווט ראשי">
      <div className="brand"><span className="brand-mark"><Sparkles size={21}/></span><span><strong>Revu</strong><small>ניהול מוניטין חכם</small></span><button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="סגירת תפריט"><X/></button></div>
      <nav>{navItems.map(({ id, icon: Icon }) => <NavLink key={id} to={routeFor(id)} onClick={() => setMenuOpen(false)}><Icon size={19}/><span>{navLabels[id]}</span>{id === "reviews" && deriveStats(visibleReviews).pending > 0 && <b>{deriveStats(visibleReviews).pending}</b>}</NavLink>)}</nav>
      <div className="sidebar-card"><span><Sparkles size={18}/></span><strong>העוזר החכם עובד בשבילך</strong><p>94% מהביקורות קיבלו מענה השבוע.</p><div><i style={{ width: "94%" }}/></div></div>
      <div className="sidebar-profile"><span>מ</span><div><strong>מיכל כהן</strong><small>מנהלת הסוכנות</small></div><MoreHorizontal size={18}/></div>
    </aside>
    {menuOpen && <button className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="סגירת תפריט"/>}
    <div className="main-area">
      <header className="topbar"><div className="mobile-brand"><button className="icon-button" onClick={() => setMenuOpen(true)} aria-label="פתיחת תפריט"><Menu size={21}/></button><span className="brand-mark"><Sparkles size={18}/></span></div><label className="account-select"><span>תצוגת חשבון</span><div><Building2 size={17}/><select aria-label="בחירת עסק" value={selectedLocation} onChange={(event) => selectLocation(event.target.value)}><option value="all">כל הלקוחות</option>{locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={15}/></div></label><div className="topbar-actions"><span className="sync-status"><span/> מסונכרן עם Google</span><ThemeToggle theme={theme} onToggle={toggleTheme}/><button className="icon-button notification" aria-label="התראות"><Bell size={19}/><span/></button><div className="mini-avatar">מכ</div></div></header>
      <main><div className="content-wrap">
        {error && <div className="error-banner" role="alert">{error}<button onClick={() => setError("")} aria-label="סגירת הודעה"><X size={16}/></button></div>}
        <Routes>
          <Route path="/" element={<Navigate to={routeFor("overview")} replace />} />
          <Route path="/overview" element={<Overview reviews={visibleReviews} selectedLocation={selectedLocation} onNavigate={navigate}/>} />
          <Route path="/reviews" element={<Reviews reviews={visibleReviews} onApprove={(id) => void approve(id)} onEdit={openEditor} onDelete={(review) => void deleteReview(review)} busy={busy}/>} />
          <Route path="/posts" element={<Posts key={selectedLocation} posts={posts} selectedLocation={selectedLocation} onCreate={createPost} onToggleStatus={togglePostStatus}/>} />
          <Route path="/settings" element={<SettingsView selectedLocation={selectedLocation} onSelectLocation={selectLocation} settings={settings} onUpdate={updateSettings}/>} />
          <Route path="*" element={<Navigate to={routeFor("overview")} replace />} />
        </Routes>
      </div></main>
      <nav className="mobile-nav" aria-label="ניווט נייד">{navItems.map(({ id, icon: Icon }) => <NavLink key={id} to={routeFor(id)} onClick={() => setMenuOpen(false)}><Icon size={20}/><span>{navLabels[id].split(" ")[0]}</span></NavLink>)}</nav>
    </div>
    {editing && <EditModal review={editing} onClose={closeEditor} onSave={saveEdit}/>} 
  </div>;
}

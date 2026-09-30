import { useEffect, useMemo, useState } from "react";
import { Building2, Check, ChevronLeft, LoaderCircle, LockKeyhole, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { GoogleConnectionCandidates, OnboardingState, ReviewsManagerService, SessionUser } from "../services/reviewsManager";

interface OnboardingPageProps {
  user: SessionUser;
  state: OnboardingState;
  service: ReviewsManagerService;
  manage?: boolean;
  onStateChange: (state: OnboardingState) => void;
  onComplete: () => void;
}

const messages: Record<string, string> = {
  denied: "החיבור בוטל. אפשר לנסות שוב כשתהיו מוכנים.",
  empty: "החשבון חובר, אבל לא נמצאו בו עסקים זמינים. ודאו שהחשבון הוא בעלים או מנהל של פרופיל עסקי מאומת.",
  discovery_failed: "החיבור הצליח, אך לא הצלחנו לקרוא את רשימת העסקים. בדקו שה־API מאושר ופעיל ונסו שוב.",
};

export function OnboardingPage({ user, state, service, manage = false, onStateChange, onComplete }: OnboardingPageProps) {
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState<GoogleConnectionCandidates[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(messages[searchParams.get("google") ?? ""] ?? "");
  const choosing = manage || state.step === "SELECT_LOCATIONS";

  useEffect(() => {
    if (!choosing) return;
    let active = true;
    service.getGoogleCandidates().then(({ connections: values }) => {
      if (!active) return;
      setConnections(values);
      setSelected(new Set(values.flatMap((connection) => connection.accounts.flatMap((account) => account.locations.filter((location) => location.selected).map((location) => location.resourceName)))));
    }).catch((cause) => active && setError(cause instanceof Error ? cause.message : "לא הצלחנו לטעון את העסקים."));
    return () => { active = false; };
  }, [choosing, service]);

  useEffect(() => {
    if (state.step !== "SYNCING") return;
    const timer = window.setInterval(() => {
      service.getOnboarding().then((next) => {
        onStateChange(next);
        if (next.step === "COMPLETE") window.clearInterval(timer);
      }).catch(() => undefined);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [onStateChange, service, state.step]);

  const locations = useMemo(() => connections.flatMap((connection) => connection.accounts.flatMap((account) => account.locations.map((location) => ({ ...location, accountName: account.name, email: connection.email })))), [connections]);
  const toggle = (resourceName: string) => setSelected((current) => { const next = new Set(current); if (next.has(resourceName)) next.delete(resourceName); else next.add(resourceName); return next; });
  const saveSelection = async () => {
    if (!selected.size) return setError("בחרו לפחות עסק אחד כדי להמשיך.");
    setBusy(true); setError("");
    try { onStateChange(await service.selectGoogleLocations([...selected])); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "שמירת הבחירה נכשלה."); }
    finally { setBusy(false); }
  };
  const retrySync = async () => {
    setBusy(true); setError("");
    try { onStateChange(await service.syncGoogleReviews()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "הסנכרון לא התחיל."); }
    finally { setBusy(false); }
  };

  return <main className="onboarding-shell" dir="rtl"><div className="onboarding-top"><div className="brand"><span className="brand-mark"><Sparkles size={21} /></span><span><strong>Revu</strong><small>הקמת סביבת עבודה</small></span></div><span className="onboarding-user">{user.email}</span></div><section className="onboarding-card">
    <div className="onboarding-progress" aria-label="שלבי ההקמה"><span className="done"><Check size={13} /></span><i /><span className={state.connection ? "done" : "active"}>{state.connection ? <Check size={13} /> : "2"}</span><i /><span className={choosing || state.selectedLocationCount ? "active" : ""}>3</span><i /><span className={state.step === "SYNCING" || state.step === "COMPLETE" ? "active" : ""}>4</span></div>
    {error && <div className="onboarding-alert" role="alert">{error}</div>}
    {(state.step === "WELCOME" || state.step === "CONNECT") && <div className="onboarding-intro"><span className="onboarding-hero-icon"><Building2 size={30} /></span><p className="eyebrow">ברוכים הבאים ל־Revu</p><h1>חברו את העסק שלכם ל־Google</h1><p>Revu תייבא את המיקומים והביקורות שתבחרו. בשלב הזה החיבור הוא לקריאה בלבד — לא נפרסם תגובות או פוסטים.</p><div className="readonly-note"><ShieldCheck size={20} /><div><strong>שליטה מלאה נשארת אצלכם</strong><span>אתם בוחרים אילו עסקים לחבר ויכולים לנתק אותם בכל עת.</span></div></div><a className="primary-button onboarding-primary" href={service.getGoogleBusinessConnectUrl()}>חיבור חשבון Google <ChevronLeft size={18} /></a><small className="oauth-note"><LockKeyhole size={13} /> Google תציג הרשאת business.manage; Revu אוכפת מצב קריאה בלבד בשרת.</small></div>}
    {choosing && <div className="onboarding-selection"><p className="eyebrow">בחירת עסקים</p><h1>אילו מיקומים תרצו לנהל?</h1><p>נייבא ביקורות רק מהמיקומים שתסמנו.</p>{locations.length ? <div className="candidate-list">{locations.map((location) => <label className={`candidate-card ${selected.has(location.resourceName) ? "selected" : ""}`} key={`${location.id}-${location.email}`}><input type="checkbox" checked={selected.has(location.resourceName)} onChange={() => toggle(location.resourceName)} /><span className="candidate-check">{selected.has(location.resourceName) && <Check size={15} />}</span><span className="candidate-icon"><Building2 size={20} /></span><span><strong>{location.name}</strong><small>{location.category} · {location.accountName}</small><small>{location.verified ? "פרופיל מאומת" : "ייתכן שהפרופיל עדיין אינו מאומת"}</small></span></label>)}</div> : <div className="empty-candidates"><Building2 size={28} /><strong>לא נמצאו עסקים זמינים</strong><p>נסו חשבון Google אחר שמוגדר כבעלים או מנהל.</p></div>}<div className="wizard-actions"><a className="secondary-button" href={service.getGoogleBusinessConnectUrl()}>חיבור חשבון נוסף</a><button className="primary-button" disabled={busy || !selected.size} onClick={() => void saveSelection()}>{busy ? "שומרים..." : `שמירה וסנכרון (${selected.size})`} <ChevronLeft size={17} /></button></div></div>}
    {state.step === "SYNCING" && !manage && <div className="onboarding-sync"><LoaderCircle className="spin" size={36} /><p className="eyebrow">הסנכרון הראשון התחיל</p><h1>אנחנו מביאים את הביקורות שלכם</h1><p>{state.syncedLocationCount} מתוך {state.selectedLocationCount} מיקומים הושלמו. אפשר להשאיר את החלון פתוח — זה אמור לקחת רגע.</p><div className="sync-meter"><span style={{ width: `${Math.max(8, state.selectedLocationCount ? state.syncedLocationCount / state.selectedLocationCount * 100 : 8)}%` }} /></div></div>}
    {state.step === "SYNC_FAILED" && !manage && <div className="onboarding-sync"><RefreshCw size={34} /><p className="eyebrow">הסנכרון נעצר</p><h1>לא הצלחנו להשלים את הייבוא</h1><p>הנתונים שכבר נקלטו נשמרו. אפשר לנסות שוב או לחבר מחדש את Google.</p><div className="wizard-actions"><a className="secondary-button" href={service.getGoogleBusinessConnectUrl()}>חיבור מחדש</a><button className="primary-button" disabled={busy} onClick={() => void retrySync()}>{busy ? "מנסים..." : "ניסיון סנכרון נוסף"}</button></div></div>}
    {state.step === "COMPLETE" && !manage && <div className="onboarding-sync"><span className="success-orb"><Check size={28} /></span><p className="eyebrow">הכל מוכן</p><h1>העסקים מחוברים ל־Revu</h1><p>{state.selectedLocationCount} מיקומים מחוברים במצב קריאה בלבד. הביקורות יתעדכנו אוטומטית.</p><button className="primary-button onboarding-primary" onClick={onComplete}>כניסה ללוח הבקרה <ChevronLeft size={18} /></button></div>}
  </section></main>;
}

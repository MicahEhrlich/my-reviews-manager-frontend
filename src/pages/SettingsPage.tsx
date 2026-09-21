import { useState } from "react";
import { Building2, CheckCircle2, MessageSquareText, Settings, Sparkles, WandSparkles } from "lucide-react";
import { LocationMark } from "../components/ui/LocationMark";
import { Switch } from "../components/ui/Switch";
import { toneLabels, type Location as BusinessLocation, type LocationSettings, type Tone } from "../mockData";

export interface SettingsPageProps {
  selectedLocation: string;
  locations: BusinessLocation[];
  settings: Record<string, LocationSettings>;
  connectUrl: string;
  onSelectLocation: (id: string) => void;
  onUpdate: (locationId: string, patch: Partial<LocationSettings>) => Promise<boolean>;
}

export function SettingsPage({ selectedLocation, locations, settings, connectUrl, onSelectLocation, onUpdate }: SettingsPageProps) {
  const [saved, setSaved] = useState(false);
  const current = selectedLocation === "all" ? null : settings[selectedLocation];
  const update = async (patch: Partial<LocationSettings>) => {
    if (current && await onUpdate(selectedLocation, patch)) {
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    }
  };

  return <div className="view-stack settings-page"><div className="page-heading"><div><p className="eyebrow">העדפות וחיבורים</p><h1>הגדרות</h1><p>התאימו את אופן הפעולה לכל אחד מהעסקים.</p></div>{saved && <span className="saved-toast"><CheckCircle2 size={16} /> השינויים נשמרו</span>}</div><section className="panel connection-panel"><div className="connection-icon"><Building2 size={22} /></div><div><h2>חשבון Google Business Profile</h2><p>חיבור החשבון והרשאות הניהול מתבצעים באופן מאובטח דרך Google.</p><code>business.manage</code></div><a className="secondary-button" href={connectUrl}>חיבור או ניהול חשבון</a></section><section className="panel business-settings"><div className="panel-heading"><div><h2>הגדרות תגובה לפי עסק</h2><p>לכל עסק אפשר להגדיר קול וכללי אוטומציה שונים</p></div></div>{selectedLocation === "all" ? <div className="location-prompt"><span><Settings size={26} /></span><h3>בחרו עסק כדי להמשיך</h3><p>ההגדרות נשמרות בנפרד לכל מיקום.</p><div>{locations.map((item) => <button key={item.id} onClick={() => onSelectLocation(item.id)}><LocationMark locationId={item.id} locations={locations} /><span aria-hidden>←</span></button>)}</div></div> : current && <div className="settings-content"><div className="selected-business"><LocationMark locationId={selectedLocation} locations={locations} /><button className="text-button" onClick={() => onSelectLocation("all")}>החלפת עסק</button></div><div className="setting-row"><div><span className="setting-icon"><MessageSquareText size={19} /></span><div><strong>טון התגובה של ה־AI</strong><p>הסגנון שישמש ליצירת טיוטות חדשות</p></div></div><select value={current.tone} onChange={(event) => void update({ tone: event.target.value as Tone })}>{Object.entries(toneLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></div><div className="setting-row"><div><span className="setting-icon"><WandSparkles size={19} /></span><div><strong>מענה אוטומטי לביקורות חיוביות</strong><p>תגובות לביקורות של 4–5 כוכבים יישלחו ללא אישור</p></div></div><Switch checked={current.autoReply} onChange={(value) => void update({ autoReply: value })} label="מענה אוטומטי לביקורות חיוביות" /></div><div className="tone-preview"><span><Sparkles size={18} /></span><div><strong>כך נשמעת תגובה בסגנון “{toneLabels[current.tone]}”</strong><p>{current.tone === "warm" ? "תודה רבה על המילים החמות! שמחנו לארח אותך ומחכים כבר לפעם הבאה 💜" : current.tone === "professional" ? "תודה על המשוב החיובי. אנו שמחים שהשירות עמד בציפיותיך." : "תודה על המשוב! שמחנו לעזור ונשמח לראותך שוב."}</p></div></div></div>}</section></div>;
}

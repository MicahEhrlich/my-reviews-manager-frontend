import type { ReactNode } from "react";
import { Bell, Building2, ChevronDown, LogOut, Menu, Sparkles, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { navItems, type View } from "../../app/navigation";
import { initials } from "../../app/utils";
import { navLabels, type Location as BusinessLocation, type Theme } from "../../mockData";
import type { SessionUser } from "../../services/reviewsManager";
import { ThemeToggle } from "../ui/ThemeToggle";

export interface DashboardLayoutProps {
  children: ReactNode;
  user: SessionUser;
  locations: BusinessLocation[];
  selectedLocation: string;
  pendingApprovalCount: number;
  theme: Theme;
  menuOpen: boolean;
  error: string;
  loading: boolean;
  logoutBusy: boolean;
  routeFor: (view: View) => string;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onSelectLocation: (id: string) => void;
  onToggleTheme: () => void;
  onLogout: () => void;
  onDismissError: () => void;
}

export function DashboardLayout({ children, user, locations, selectedLocation, pendingApprovalCount, theme, menuOpen, error, loading, logoutBusy, routeFor, onMenuOpen, onMenuClose, onSelectLocation, onToggleTheme, onLogout, onDismissError }: DashboardLayoutProps) {
  return <div className="dashboard-shell" dir="rtl"><aside className={`sidebar ${menuOpen ? "open" : ""}`} aria-label="ניווט ראשי"><div className="brand"><span className="brand-mark"><Sparkles size={21} /></span><span><strong>Revu</strong><small>ניהול מוניטין חכם</small></span><button className="mobile-close" onClick={onMenuClose} aria-label="סגירת תפריט"><X /></button></div><nav>{navItems.map(({ id, icon: Icon }) => <NavLink key={id} to={routeFor(id)} onClick={onMenuClose}><Icon size={19} /><span>{navLabels[id]}</span>{id === "reviews" && pendingApprovalCount > 0 && <b>{pendingApprovalCount}</b>}</NavLink>)}</nav><div className="sidebar-card"><span><Sparkles size={18} /></span><strong>העוזר החכם עובד בשבילך</strong><p>הנתונים מתעדכנים ישירות מהמערכת.</p></div><div className="sidebar-profile"><span>{initials(user.displayName)}</span><div><strong>{user.displayName}</strong><small>{user.role === "ADMIN" ? "מנהלת הסוכנות" : "חברת צוות"}</small></div><button className="icon-button" onClick={onLogout} disabled={logoutBusy} aria-label="התנתקות"><LogOut size={17} /></button></div></aside>{menuOpen && <button className="sidebar-scrim" onClick={onMenuClose} aria-label="סגירת תפריט" />}<div className="main-area"><header className="topbar"><div className="mobile-brand"><button className="icon-button" onClick={onMenuOpen} aria-label="פתיחת תפריט"><Menu size={21} /></button><span className="brand-mark"><Sparkles size={18} /></span></div><label className="account-select"><span>תצוגת חשבון</span><div><Building2 size={17} /><select aria-label="בחירת עסק" value={selectedLocation} onChange={(event) => onSelectLocation(event.target.value)}><option value="all">כל הלקוחות</option>{locations.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><ChevronDown size={15} /></div></label><div className="topbar-actions"><span className="sync-status"><span /> מחובר למערכת</span><ThemeToggle theme={theme} onToggle={onToggleTheme} /><button className="icon-button notification" aria-label="התראות"><Bell size={19} /></button><div className="mini-avatar">{initials(user.displayName)}</div></div></header><main><div className="content-wrap">{error && <div className="error-banner" role="alert">{error}<button onClick={onDismissError} aria-label="סגירת הודעה"><X size={16} /></button></div>}{loading ? <div className="app-loading" role="status">טוענים נתונים...</div> : children}</div></main><nav className="mobile-nav" aria-label="ניווט נייד">{navItems.map(({ id, icon: Icon }) => <NavLink key={id} to={routeFor(id)}><Icon size={20} /><span>{navLabels[id].split(" ")[0]}</span></NavLink>)}</nav></div></div>;
}

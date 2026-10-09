import { Sparkles } from "lucide-react";

export interface UnauthenticatedProps {
  loginUrl: string;
  googleAuth: boolean;
  onRetry: () => void;
}

export function Unauthenticated({ loginUrl, googleAuth, onRetry }: UnauthenticatedProps) {
  return <main className="auth-screen" dir="rtl"><span className="brand-mark"><Sparkles size={22} /></span><h1>{googleAuth ? "ברוכים הבאים ל־Revu" : "סשן הפיתוח אינו זמין"}</h1><p>{googleAuth ? "התחברו עם חשבון Google כדי לנהל את הביקורות והעסקים שלכם." : "במצב פיתוח אין התחברות עם Google. ודאו שה־backend פעיל, שמסד הנתונים נזרע וש־FRONTEND_ORIGIN תואם לכתובת הדפדפן."}</p>{googleAuth ? <a className="primary-button" href={loginUrl}>התחברות עם Google</a> : <button className="primary-button" onClick={onRetry}>ניסיון חיבור מחדש</button>}</main>;
}

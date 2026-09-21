import { useEffect } from "react";
import { Sparkles } from "lucide-react";

export interface StartupFailureProps {
  message: string;
  onRetry: () => void;
}

export function StartupFailure({ message, onRetry }: StartupFailureProps) {
  useEffect(() => { const timer = window.setTimeout(onRetry, 3_000); return () => window.clearTimeout(timer); }, [onRetry]);
  return <main className="auth-screen" dir="rtl"><span className="brand-mark"><Sparkles size={22} /></span><h1>לא הצלחנו להתחבר לשרת</h1><p>{message}</p><button className="primary-button" onClick={onRetry}>ניסיון נוסף</button></main>;
}

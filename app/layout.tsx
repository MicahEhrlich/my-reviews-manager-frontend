import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revu — ניהול מוניטין חכם",
  description: "מערכת חכמה לניהול ביקורות ופוסטים בגוגל לעסקים.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('agency-theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d)}catch(e){}})()` }} /></head>
      <body>{children}</body>
    </html>
  );
}

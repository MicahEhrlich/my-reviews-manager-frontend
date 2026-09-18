export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewStatus = "pending" | "auto-sent" | "approved";
export type PostType = "update" | "offer" | "event";
export type PostStatus = "published" | "scheduled" | "paused";
export type Tone = "warm" | "professional" | "short";
export type Theme = "light" | "dark";

export interface Location {
  id: string;
  name: string;
  category: string;
  city: string;
  color: string;
}

export interface Review {
  id: string;
  customerName: string;
  rating: Rating;
  date: string;
  locationId: string;
  text: string;
  aiResponse: string;
  status: ReviewStatus;
  responseMinutes?: number;
}

export interface GooglePost {
  id: string;
  locationId: string;
  type: PostType;
  text: string;
  imageUrl?: string;
  autoRenew: boolean;
  status: PostStatus;
  publishedAt: string;
}

export interface LocationSettings {
  tone: Tone;
  autoReply: boolean;
}

export const locations: Location[] = [
  { id: "eli", name: "מספרת אלי", category: "מספרה", city: "תל אביב", color: "#725CF2" },
  { id: "lock", name: "מנעולן אקספרס", category: "מנעולנות", city: "רמת גן", color: "#0E9F8E" },
  { id: "nona", name: "נונה ביסטרו", category: "מסעדה", city: "גבעתיים", color: "#F08A4B" },
];

export const initialReviews: Review[] = [
  {
    id: "r1", customerName: "נועה לוי", rating: 5, date: "2026-09-17", locationId: "eli",
    text: "אלי פשוט אלוף. הקשיב בדיוק למה שרציתי, היה סבלני והתוצאה יצאה מושלמת. אחזור בוודאות!",
    aiResponse: "נועה, איזה כיף לקרוא! תודה שבחרת בנו וששיתפת. שמחנו לארח אותך ומחכים כבר לפעם הבאה 💜",
    status: "auto-sent", responseMinutes: 3,
  },
  {
    id: "r2", customerName: "דניאל כהן", rating: 1, date: "2026-09-17", locationId: "lock",
    text: "חיכיתי כמעט שעה מעבר למה שנאמר לי בטלפון והמחיר היה גבוה מהציפייה. חוויה מאכזבת.",
    aiResponse: "דניאל, אנחנו מצטערים לשמוע על העיכוב ועל התחושה שנוצרה. זו אינה רמת השירות שאליה אנחנו שואפים. נשמח שתיצור איתנו קשר כדי שנוכל לבדוק את המקרה ולמצוא פתרון הוגן.",
    status: "pending",
  },
  {
    id: "r3", customerName: "מיכל אדרי", rating: 4, date: "2026-09-16", locationId: "nona",
    text: "אוכל מצוין ואווירה נעימה מאוד. השירות היה קצת איטי בשעה העמוסה, אבל בהחלט נחזור.",
    aiResponse: "מיכל, תודה רבה על המילים הטובות ועל המשוב הכנה. שמחים שנהנית מהאוכל ומהאווירה, וניקח לתשומת ליבנו את נושא זמני השירות. נשמח לארח אתכם שוב!",
    status: "auto-sent", responseMinutes: 5,
  },
  {
    id: "r4", customerName: "יואב פרץ", rating: 3, date: "2026-09-15", locationId: "eli",
    text: "התספורת יצאה בסדר, אבל נאלצתי להמתין חצי שעה למרות שקבעתי תור מראש.",
    aiResponse: "יואב, תודה על המשוב. אנחנו מתנצלים על ההמתנה ומבינים כמה הזמן שלך חשוב. נחדד את ניהול התורים כדי שבביקור הבא החוויה תהיה מדויקת ונעימה יותר.",
    status: "pending",
  },
  {
    id: "r5", customerName: "שרון אביטל", rating: 5, date: "2026-09-14", locationId: "lock",
    text: "הגיע תוך עשרים דקות, פתר את הבעיה במהירות והסביר הכול בסבלנות. שירות אמין ומקצועי.",
    aiResponse: "שרון, תודה על ההמלצה! שמחים שהצלחנו להגיע במהירות ולפתור את הבעיה. אנחנו כאן בשבילך בכל צורך.",
    status: "auto-sent", responseMinutes: 2,
  },
  {
    id: "r6", customerName: "רוני ושחר", rating: 5, date: "2026-09-13", locationId: "nona",
    text: "חגגנו יום נישואין והצוות הפך את הערב למיוחד. מנות נהדרות, קינוח מעולה ושירות מכל הלב.",
    aiResponse: "רוני ושחר היקרים, תודה שבחרתם לחגוג איתנו! היה לנו לעונג להיות חלק מהערב המיוחד שלכם. מאחלים עוד המון שנים שמחות יחד ומחכים לחגיגה הבאה 🥂",
    status: "auto-sent", responseMinutes: 4,
  },
  {
    id: "r7", customerName: "אור בן דוד", rating: 3, date: "2026-09-12", locationId: "nona",
    text: "המנות טעימות אבל היה רועש מאוד והמזגן כמעט לא הורגש. השירות עצמו היה אדיב.",
    aiResponse: "אור, תודה ששיתפת אותנו. שמחים שנהנית מהמנות ומהשירות, ומתנצלים על אי הנוחות באולם. אנחנו בודקים את נושא המיזוג ונשמח להעניק לך חוויה טובה יותר בביקור הבא.",
    status: "pending",
  },
];

export const initialPosts: GooglePost[] = [
  { id: "p1", locationId: "eli", type: "update", text: "פותחים את השבוע עם לוק חדש ✂️ נשארו תורים אחרונים ליום חמישי.", autoRenew: true, status: "published", publishedAt: "2026-09-16" },
  { id: "p2", locationId: "nona", type: "offer", text: "ארוחה זוגית באמצע השבוע: שתי עיקריות וקינוח ב־189 ₪.", autoRenew: false, status: "scheduled", publishedAt: "2026-09-19" },
  { id: "p3", locationId: "lock", type: "update", text: "נתקעתם מחוץ לבית? שירות פריצה מהיר וזמין 24/7 בגוש דן.", autoRenew: true, status: "published", publishedAt: "2026-09-15" },
];

export const initialSettings: Record<string, LocationSettings> = {
  eli: { tone: "warm", autoReply: true },
  lock: { tone: "professional", autoReply: true },
  nona: { tone: "warm", autoReply: true },
};

export const navLabels = {
  overview: "סקירה כללית",
  reviews: "ניהול ביקורות",
  posts: "פוסטים בגוגל",
  settings: "הגדרות",
} as const;

export const toneLabels: Record<Tone, string> = {
  warm: "חם ואישי",
  professional: "מקצועי ורשמי",
  short: "קצר וענייני",
};

export const postTypeLabels: Record<PostType, string> = {
  update: "עדכון רגיל",
  offer: "מבצע",
  event: "אירוע",
};

export const postStatusLabels: Record<PostStatus, string> = {
  published: "פורסם",
  scheduled: "מתוזמן",
  paused: "מושהה",
};

export function formatHebrewDate(date: string) {
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
}

export function deriveStats(reviews: Review[]) {
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, review) => sum + review.rating, 0) / total : 0;
  const answered = reviews.filter((review) => review.status !== "pending").length;
  const responseRate = total ? Math.round((answered / total) * 100) : 0;
  const responseTimes = reviews.flatMap((review) => review.responseMinutes ?? []);
  const averageMinutes = responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0;
  return {
    total,
    average,
    responseRate,
    averageMinutes,
    pending: reviews.filter((review) => review.status === "pending").length,
    positive: reviews.filter((review) => review.rating >= 4).length,
    negative: reviews.filter((review) => review.rating <= 3).length,
  };
}

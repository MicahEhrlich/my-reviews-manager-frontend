import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { Navigate, Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { View } from "./app/navigation";
import { mergeById } from "./app/utils";
import { StartupFailure } from "./components/auth/StartupFailure";
import { Unauthenticated } from "./components/auth/Unauthenticated";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { EditReviewModal } from "./components/reviews/EditReviewModal";
import type {
  GooglePost,
  Location as BusinessLocation,
  LocationSettings,
  Review,
  Theme,
} from "./mockData";
import { OverviewPage } from "./pages/OverviewPage";
import { PostsPage } from "./pages/PostsPage";
import { ReviewsPage } from "./pages/ReviewsPage";
import { SettingsPage } from "./pages/SettingsPage";
import {
  ReviewsManagerApiError,
  type CreatePostInput,
  type OverviewStats,
  type ReviewsManagerService,
  type SessionUser,
} from "./services/reviewsManager";

type ReviewFilter = "all" | "pending" | "positive" | "negative";

const PAGE_SIZE = 25;
const emptyStats: OverviewStats = {
  totalReviews: 0,
  averageRating: 0,
  responseRate: 0,
  pendingApprovalCount: 0,
};

export interface AppProps {
  service: ReviewsManagerService;
}

export default function App({ service }: AppProps) {
  const routerNavigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLocation = searchParams.get("location") ?? "all";
  const rawFilter = searchParams.get("filter");
  const filter = (["pending", "positive", "negative"].includes(rawFilter ?? "") ? rawFilter : "all") as ReviewFilter;
  const rawQuery = searchParams.get("q") ?? "";

  const [user, setUser] = useState<SessionUser | null>(null);
  const [locations, setLocations] = useState<BusinessLocation[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [posts, setPosts] = useState<GooglePost[]>([]);
  const [settings, setSettings] = useState<Record<string, LocationSettings>>({});
  const [stats, setStats] = useState(emptyStats);
  const [reviewCursor, setReviewCursor] = useState<string | null>(null);
  const [postCursor, setPostCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState<"reviews" | "posts" | null>(null);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [startupError, setStartupError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<Set<string>>(() => new Set());
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.classList.contains("dark") ? "dark" : "light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState(rawQuery);
  const tracked = useRef(new Map<string, number>());
  const editTriggerRef = useRef<HTMLElement | null>(null);
  const loadSequence = useRef(0);

  const selectedLocation = requestedLocation === "all" || locations.some((item) => item.id === requestedLocation)
    ? requestedLocation
    : "all";
  const locationId = selectedLocation === "all" ? undefined : selectedLocation;
  const serverStatus = filter === "pending" ? "PENDING_APPROVAL" as const : undefined;

  const showError = useCallback((cause: unknown, fallback = "הפעולה לא הושלמה. נסו שוב בעוד רגע.") => {
    if (cause instanceof ReviewsManagerApiError && cause.status === 401) {
      setUnauthenticated(true);
      return;
    }
    setError(cause instanceof ReviewsManagerApiError ? cause.message : fallback);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([service.getSession(), service.getLocations()])
      .then(([session, data]) => {
        if (!active) return;
        setUser(session);
        setLocations(data.locations);
        setSettings(data.settings);
      })
      .catch((cause) => {
        if (!active) return;
        if (cause instanceof ReviewsManagerApiError && cause.status === 401) {
          setUnauthenticated(true);
        } else {
          setStartupError(cause instanceof ReviewsManagerApiError
            ? cause.message
            : "ה־API אינו זמין או שהדפדפן חסם את הבקשה. בדקו את VITE_API_BASE_URL ואת FRONTEND_ORIGIN.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryKey, service]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(rawQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [rawQuery]);

  const refresh = useCallback(async (quiet = false) => {
    if (!user) return;
    const sequence = ++loadSequence.current;
    if (!quiet) setLoading(true);
    try {
      const [overview, reviewPage, postPage] = await Promise.all([
        service.getOverviewStats(locationId),
        service.getReviews({ locationId, q: debouncedQuery || undefined, status: serverStatus, limit: PAGE_SIZE }),
        service.getPosts({ locationId, limit: PAGE_SIZE }),
      ]);
      if (sequence !== loadSequence.current) return;
      setStats(overview);
      setReviews((current) => quiet ? mergeById(current, reviewPage.items) : reviewPage.items);
      if (!quiet) setReviewCursor(reviewPage.nextCursor);
      setPosts((current) => quiet ? mergeById(current, postPage.items) : postPage.items);
      if (!quiet) setPostCursor(postPage.nextCursor);
      setError("");
    } catch (cause) {
      if (sequence === loadSequence.current) {
        showError(cause, "לא הצלחנו לטעון את נתוני המערכת. נסו לרענן את הדף.");
      }
    } finally {
      if (!quiet && sequence === loadSequence.current) setLoading(false);
    }
  }, [debouncedQuery, locationId, serverStatus, service, showError, user]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh, user]);

  useEffect(() => {
    if (!user) return;
    const onFocus = () => void refresh(true);
    const timer = window.setInterval(() => {
      if (!document.hidden) void refresh(true);
    }, 30_000);
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, user]);

  useEffect(() => {
    if (!user) return;
    const timer = window.setInterval(async () => {
      if (tracked.current.size === 0) return;
      try {
        const [reviewPage, postPage] = await Promise.all([
          service.getReviews({ locationId, q: debouncedQuery || undefined, limit: 100 }),
          service.getPosts({ locationId, limit: 100 }),
        ]);
        setReviews((current) => mergeById(current, reviewPage.items));
        setPosts((current) => mergeById(current, postPage.items));
        const transient = new Set<string>();
        reviewPage.items
          .filter((item) => item.status === "approving" || item.status === "processing" || item.status === "queued")
          .forEach((item) => transient.add(`review:${item.id}`));
        postPage.items
          .filter((item) => item.status === "generating" || item.status === "publishing" || item.status === "scheduled")
          .forEach((item) => transient.add(`post:${item.id}`));
        const now = Date.now();
        tracked.current.forEach((startedAt, id) => {
          if (!transient.has(id) || now - startedAt > 60_000) tracked.current.delete(id);
        });
      } catch {
        // Regular refreshes report persistent failures.
      }
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [debouncedQuery, locationId, service, user]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [routerLocation.pathname]);

  const execute = async <T,>(key: string, action: () => Promise<T>): Promise<T | undefined> => {
    setBusy((current) => new Set(current).add(key));
    setError("");
    try {
      return await action();
    } catch (cause) {
      showError(cause);
      return undefined;
    } finally {
      setBusy((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  const loadMoreReviews = async () => {
    if (!reviewCursor) return;
    setLoadingMore("reviews");
    try {
      const page = await service.getReviews({
        locationId,
        q: debouncedQuery || undefined,
        status: serverStatus,
        cursor: reviewCursor,
        limit: PAGE_SIZE,
      });
      setReviews((current) => mergeById(current, page.items));
      setReviewCursor(page.nextCursor);
    } catch (cause) {
      showError(cause);
    } finally {
      setLoadingMore(null);
    }
  };

  const loadMorePosts = async () => {
    if (!postCursor) return;
    setLoadingMore("posts");
    try {
      const page = await service.getPosts({ locationId, cursor: postCursor, limit: PAGE_SIZE });
      setPosts((current) => mergeById(current, page.items));
      setPostCursor(page.nextCursor);
    } catch (cause) {
      showError(cause);
    } finally {
      setLoadingMore(null);
    }
  };

  const approve = async (id: string) => {
    const result = await execute(`review:${id}`, () => service.approveReview(id));
    if (result) {
      setReviews((current) => current.map((item) => item.id === id ? { ...item, status: result.status } : item));
      tracked.current.set(`review:${id}`, Date.now());
      await refresh(true);
    }
  };

  const deleteReview = async (review: Review) => {
    if (!window.confirm(`למחוק את הביקורת של ${review.customerName}?`)) return;
    const removed = await execute(`review:${review.id}`, async () => {
      await service.deleteReview(review.id);
      return true;
    });
    if (removed) {
      setReviews((current) => current.filter((item) => item.id !== review.id));
      void service.getOverviewStats(locationId).then(setStats);
    }
  };

  const saveEdit = async (text: string, shouldApprove: boolean) => {
    if (!editing) return;
    const id = editing.id;
    const updated = await execute(`review:${id}`, () => service.saveReview(id, { response: text, approve: shouldApprove }));
    if (updated) {
      setReviews((current) => current.map((item) => item.id === id ? updated : item));
      if (updated.status === "approving") tracked.current.set(`review:${id}`, Date.now());
      setEditing(null);
      requestAnimationFrame(() => editTriggerRef.current?.focus());
    } else {
      await refresh(true);
    }
  };

  const createPost = async (input: CreatePostInput) => {
    const post = await execute("create-post", () => service.createPost(input));
    if (!post) return false;
    setPosts((current) => [post, ...current]);
    if (post.status === "scheduled" || post.status === "publishing") {
      tracked.current.set(`post:${post.id}`, Date.now());
    }
    void service.getOverviewStats(locationId).then(setStats);
    return true;
  };

  const togglePostStatus = async (post: GooglePost) => {
    const updated = await execute(`post:${post.id}`, () => service.changePostStatus(
      post.id,
      post.status === "paused" ? "published" : "paused",
    ));
    if (updated) {
      setPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
    }
  };

  const retryPost = async (post: GooglePost) => {
    const updated = await execute(`post:${post.id}`, () => service.retryPost(post.id));
    if (updated) {
      setPosts((current) => current.map((item) => item.id === updated.id ? updated : item));
      tracked.current.set(`post:${post.id}`, Date.now());
    }
  };

  const updateSettings = async (id: string, patch: Partial<LocationSettings>) => {
    const updated = await execute(`settings:${id}`, () => service.updateLocationSettings(id, patch));
    if (!updated) return false;
    setSettings((current) => ({ ...current, [id]: updated }));
    return true;
  };

  const selectLocation = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("location", locations.some((item) => item.id === id) ? id : "all");
    setSearchParams(next);
  };
  const routeFor = (next: View) => `/${next}?location=${selectedLocation}`;
  const navigate = (next: View) => routerNavigate(routeFor(next));
  const logout = async () => {
    const done = await execute("logout", async () => {
      await service.logout();
      return true;
    });
    if (done) {
      setUser(null);
      setUnauthenticated(true);
    }
  };
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("agency-theme", next);
    setTheme(next);
  };
  const retryConnection = () => {
    setUser(null);
    setLoading(true);
    setStartupError("");
    setUnauthenticated(false);
    setRetryKey((value) => value + 1);
  };

  if (unauthenticated) {
    return <Unauthenticated loginUrl={service.getLoginUrl()} googleAuth={service.getAuthMode() === "google"} onRetry={retryConnection} />;
  }
  if (loading && !user) {
    return <div className="app-loading" dir="rtl" role="status"><span className="brand-mark"><Sparkles size={22} /></span><strong>טוענים את Revu...</strong></div>;
  }
  if (startupError) return <StartupFailure message={startupError} onRetry={retryConnection} />;
  if (!user) {
    return <Unauthenticated loginUrl={service.getLoginUrl()} googleAuth={service.getAuthMode() === "google"} onRetry={retryConnection} />;
  }

  return <>
    <DashboardLayout
      user={user}
      locations={locations}
      selectedLocation={selectedLocation}
      pendingApprovalCount={stats.pendingApprovalCount}
      theme={theme}
      menuOpen={menuOpen}
      error={error}
      loading={loading}
      logoutBusy={busy.has("logout")}
      routeFor={routeFor}
      onMenuOpen={() => setMenuOpen(true)}
      onMenuClose={() => setMenuOpen(false)}
      onSelectLocation={selectLocation}
      onToggleTheme={toggleTheme}
      onLogout={() => void logout()}
      onDismissError={() => setError("")}
    >
      <Routes>
        <Route path="/" element={<Navigate to={routeFor("overview")} replace />} />
        <Route path="/overview" element={<OverviewPage reviews={reviews} stats={stats} locations={locations} selectedLocation={selectedLocation} user={user} onNavigate={navigate} />} />
        <Route path="/reviews" element={<ReviewsPage reviews={reviews} locations={locations} nextCursor={reviewCursor} loadingMore={loadingMore === "reviews"} onLoadMore={() => void loadMoreReviews()} onApprove={(id) => void approve(id)} onEdit={(review) => { editTriggerRef.current = document.activeElement as HTMLElement; setEditing(review); }} onDelete={(review) => void deleteReview(review)} busy={busy} />} />
        <Route path="/posts" element={<PostsPage key={selectedLocation} posts={posts} locations={locations} selectedLocation={selectedLocation} nextCursor={postCursor} loadingMore={loadingMore === "posts"} onLoadMore={() => void loadMorePosts()} onCreate={createPost} onToggleStatus={togglePostStatus} onRetry={retryPost} />} />
        <Route path="/settings" element={<SettingsPage selectedLocation={selectedLocation} locations={locations} settings={settings} connectUrl={service.getGoogleBusinessConnectUrl()} onSelectLocation={selectLocation} onUpdate={updateSettings} />} />
        <Route path="*" element={<Navigate to={routeFor("overview")} replace />} />
      </Routes>
    </DashboardLayout>
    {editing && <EditReviewModal review={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
  </>;
}

import {
  initialPosts, initialReviews, initialSettings, locations as mockLocations,
  type GooglePost, type Location, type LocationSettings, type PostStatus, type PostType,
  type Review, type ReviewStatus, type Tone,
} from "../mockData";

export interface Page<T> { items: T[]; nextCursor: string | null; }
export type Capability = "READ_REVIEWS" | "REPLY_TO_REVIEWS" | "PUBLISH_POSTS" | "AUTO_REPLY";
export interface SessionUser { id: string; email: string; displayName: string; role: "ADMIN" | "MEMBER"; capabilities: Capability[]; connection: { status: string; googleEmail: string } | null; }
export type OnboardingStep = "WELCOME" | "CONNECT" | "SELECT_LOCATIONS" | "SYNCING" | "SYNC_FAILED" | "COMPLETE";
export interface OnboardingState { step: OnboardingStep; readOnly: boolean; capabilities: Capability[]; connection: { id: string; email: string; status: string; lastError: string | null } | null; selectedLocationCount: number; syncedLocationCount: number; lastSyncAt: number | null; }
export interface GoogleLocationCandidate { id: string; resourceName: string; name: string; category: string; verified: boolean; selected: boolean; }
export interface GoogleAccountCandidate { id: string; name: string; resourceName: string; locations: GoogleLocationCandidate[]; }
export interface GoogleConnectionCandidates { id: string; email: string; status: string; accounts: GoogleAccountCandidate[]; }
export interface OverviewStats { totalReviews: number; averageRating: number; responseRate: number; pendingApprovalCount: number; }
export interface ReviewQuery { locationId?: string; cursor?: string; limit?: number; status?: "PENDING_APPROVAL"; q?: string; }
export interface PostQuery { locationId?: string; cursor?: string; limit?: number; }
export interface SaveReviewInput { response: string; approve: boolean; }
export interface CreatePostInput { locationId: string; brief: string; publishAt?: string; autoRenew: boolean; frequencyDays: 3 | 5 | 7 | 14; }
export interface ApprovalAcknowledgement { id: string; status: "approving"; }

export interface ReviewsManagerService {
  getSession(): Promise<SessionUser>;
  getOnboarding(): Promise<OnboardingState>;
  getGoogleCandidates(): Promise<{ connections: GoogleConnectionCandidates[] }>;
  selectGoogleLocations(resourceNames: string[]): Promise<OnboardingState>;
  syncGoogleReviews(): Promise<OnboardingState>;
  disconnectGoogle(): Promise<void>;
  getLocations(): Promise<{ locations: Location[]; settings: Record<string, LocationSettings> }>;
  getOverviewStats(locationId?: string): Promise<OverviewStats>;
  getReviews(query?: ReviewQuery): Promise<Page<Review>>;
  getPosts(query?: PostQuery): Promise<Page<GooglePost>>;
  approveReview(id: string): Promise<ApprovalAcknowledgement | Review>;
  saveReview(id: string, input: SaveReviewInput): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  createPost(input: CreatePostInput): Promise<GooglePost>;
  changePostStatus(id: string, status: PostStatus): Promise<GooglePost>;
  retryPost(id: string): Promise<GooglePost>;
  updateLocationSettings(locationId: string, patch: Partial<LocationSettings>): Promise<LocationSettings>;
  logout(): Promise<void>;
  getLoginUrl(): string;
  getGoogleBusinessConnectUrl(): string;
  getAuthMode(): "dev" | "google";
}

interface ApiErrorBody { error?: { code?: string; message?: string; requestId?: string }; }
interface ApiLocation { id: string; name: string; googleLocationId: string; category: string; tone: "WARM_PERSONAL" | "PROFESSIONAL" | "SHORT_DIRECT"; autoReplyEnabled: boolean; whatsappAlertNumber: string | null; }
interface ApiReview { id: string; locationId: string; locationName: string; reviewerName: string; rating: number; text: string; aiResponse: string | null; publishedReply: string | null; status: "QUEUED" | "PROCESSING" | "PENDING_APPROVAL" | "APPROVING" | "AUTO_SENT" | "APPROVED" | "FAILED" | "DELETED"; date: string; updatedAt: string; }
interface ApiPost { id: string; locationId: string; locationName: string; type: "STANDARD" | "OFFER" | "EVENT"; text: string | null; imageUrl: string | null; brief: string | null; structuredPayload: unknown; recurring: boolean; frequencyDays: number; nextPublishAt: string | null; lastPublishedAt: string | null; status: "SCHEDULED" | "PUBLISHING" | "ACTIVE" | "PAUSED" | "FAILED"; generationStatus: "QUEUED" | "GENERATING" | "PUBLISHING" | "PUBLISHED" | "FAILED" | null; failureMessage: string | null; }

const colors = ["#725CF2", "#0E9F8E", "#F08A4B", "#3B82F6", "#D65B8F", "#8B6F47"];
const toneFromApi: Record<ApiLocation["tone"], Tone> = { WARM_PERSONAL: "warm", PROFESSIONAL: "professional", SHORT_DIRECT: "short" };
const toneToApi: Record<Tone, ApiLocation["tone"]> = { warm: "WARM_PERSONAL", professional: "PROFESSIONAL", short: "SHORT_DIRECT" };
const reviewStatusFromApi: Record<ApiReview["status"], ReviewStatus> = { QUEUED: "queued", PROCESSING: "processing", PENDING_APPROVAL: "pending", APPROVING: "approving", AUTO_SENT: "auto-sent", APPROVED: "approved", FAILED: "failed", DELETED: "failed" };
const postTypeFromApi: Record<ApiPost["type"], PostType> = { STANDARD: "update", OFFER: "offer", EVENT: "event" };
const postStatusFromApi: Record<ApiPost["status"], PostStatus> = { SCHEDULED: "scheduled", PUBLISHING: "publishing", ACTIVE: "published", PAUSED: "paused", FAILED: "failed" };

export class ReviewsManagerApiError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string, public readonly requestId?: string) { super(message); }
}

function toLocation(value: ApiLocation, index: number): Location { return { id: value.id, name: value.name, category: value.category, color: colors[index % colors.length] }; }
function toReview(value: ApiReview): Review {
  return { id: value.id, locationId: value.locationId, customerName: value.reviewerName, rating: Math.min(5, Math.max(1, value.rating)) as Review["rating"], date: value.date, text: value.text, aiResponse: value.aiResponse ?? value.publishedReply, status: reviewStatusFromApi[value.status] };
}
function toPost(value: ApiPost): GooglePost {
  const occurrenceStatus = value.generationStatus === "GENERATING" ? "generating" : value.generationStatus === "PUBLISHING" ? "publishing" : value.generationStatus === "FAILED" ? "failed" : value.generationStatus === "QUEUED" ? "scheduled" : undefined;
  return { id: value.id, locationId: value.locationId, type: postTypeFromApi[value.type], text: value.text, imageUrl: value.imageUrl ?? undefined, brief: value.brief ?? undefined, autoRenew: value.recurring, frequencyDays: [3, 5, 7, 14].includes(value.frequencyDays) ? value.frequencyDays as 3 | 5 | 7 | 14 : undefined, nextPublishAt: value.nextPublishAt, status: value.status === "PAUSED" ? "paused" : occurrenceStatus ?? postStatusFromApi[value.status], publishedAt: value.lastPublishedAt, failureMessage: value.failureMessage };
}
function queryString(values: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
  const serialized = query.toString(); return serialized ? `?${serialized}` : "";
}

export class HttpReviewsManagerService implements ReviewsManagerService {
  private readonly baseUrl: string;
  private readonly authMode: "dev" | "google";
  private csrfToken = "";

  constructor(baseUrl = import.meta.env.VITE_API_BASE_URL ?? "", private readonly fetcher: typeof fetch = fetch, authMode: "dev" | "google" = import.meta.env.PROD || import.meta.env.VITE_AUTH_MODE === "google" ? "google" : "dev") { this.baseUrl = baseUrl.replace(/\/$/, ""); this.authMode = authMode; }
  getLoginUrl() { return `${this.baseUrl}/auth/google/start`; }
  getGoogleBusinessConnectUrl() { return `${this.baseUrl}/api/v1/google-business/connect`; }
  getAuthMode() { return this.authMode; }

  async getSession(): Promise<SessionUser> {
    const result = await this.request<{ user: Omit<SessionUser, "capabilities" | "connection">; csrfToken: string; capabilities?: Capability[]; connection?: SessionUser["connection"] }>("/api/v1/session", {}, false);
    this.csrfToken = result.csrfToken; return { ...result.user, capabilities: result.capabilities ?? ["READ_REVIEWS"], connection: result.connection ?? null };
  }
  getOnboarding() { return this.request<OnboardingState>("/api/v1/onboarding"); }
  getGoogleCandidates() { return this.request<{ connections: GoogleConnectionCandidates[] }>("/api/v1/google-business/candidates"); }
  selectGoogleLocations(resourceNames: string[]) { return this.request<OnboardingState>("/api/v1/google-business/locations/select", { method: "POST", body: JSON.stringify({ resourceNames }) }); }
  syncGoogleReviews() { return this.request<OnboardingState>("/api/v1/google-business/sync", { method: "POST" }); }
  disconnectGoogle() { return this.request<void>("/api/v1/google-business/disconnect", { method: "POST" }); }
  async getLocations() {
    const result = await this.request<{ locations: ApiLocation[] }>("/api/v1/locations");
    const settings: Record<string, LocationSettings> = {};
    const locations = result.locations.map((value, index) => { settings[value.id] = { tone: toneFromApi[value.tone], autoReply: value.autoReplyEnabled }; return toLocation(value, index); });
    return { locations, settings };
  }
  getOverviewStats(locationId?: string) { return this.request<OverviewStats>(`/api/v1/overview/stats${queryString({ locationId })}`); }
  async getReviews(query: ReviewQuery = {}): Promise<Page<Review>> {
    const result = await this.request<{ reviews: ApiReview[]; nextCursor: string | null }>(`/api/v1/reviews${queryString({ ...query })}`);
    return { items: result.reviews.map(toReview), nextCursor: result.nextCursor };
  }
  async getPosts(query: PostQuery = {}): Promise<Page<GooglePost>> {
    const result = await this.request<{ posts: ApiPost[]; nextCursor: string | null }>(`/api/v1/posts${queryString({ ...query })}`);
    return { items: result.posts.map(toPost), nextCursor: result.nextCursor };
  }
  async approveReview(id: string): Promise<ApprovalAcknowledgement> {
    const result = await this.request<{ id: string; status: "APPROVING" }>(`/api/v1/reviews/${encodeURIComponent(id)}/approve`, { method: "POST" });
    return { id: result.id, status: "approving" };
  }
  async saveReview(id: string, input: SaveReviewInput): Promise<Review> {
    const result = await this.request<{ review: ApiReview }>(`/api/v1/reviews/${encodeURIComponent(id)}/draft`, { method: "PUT", body: JSON.stringify({ draft: input.response }) });
    const review = toReview(result.review); if (!input.approve) return review;
    const approval = await this.approveReview(id); return { ...review, status: approval.status };
  }
  deleteReview(id: string) { return this.request<void>(`/api/v1/reviews/${encodeURIComponent(id)}`, { method: "DELETE" }); }
  async createPost(input: CreatePostInput): Promise<GooglePost> {
    const result = await this.request<{ post: ApiPost }>("/api/v1/posts", { method: "POST", body: JSON.stringify({ locationId: input.locationId, brief: input.brief, publishAt: input.publishAt, isRecurring: input.autoRenew, frequencyDays: input.frequencyDays }) });
    return toPost(result.post);
  }
  async changePostStatus(id: string, status: PostStatus): Promise<GooglePost> {
    if (status !== "published" && status !== "paused") throw new Error("לא ניתן לשנות את מצב הפוסט הזה");
    const result = await this.request<{ post: ApiPost }>(`/api/v1/posts/${encodeURIComponent(id)}/status`, { method: "PATCH", body: JSON.stringify({ status: status === "published" ? "ACTIVE" : "PAUSED" }) });
    return toPost(result.post);
  }
  async retryPost(id: string): Promise<GooglePost> { const result = await this.request<{ post: ApiPost }>(`/api/v1/posts/${encodeURIComponent(id)}/retry`, { method: "POST" }); return toPost(result.post); }
  async updateLocationSettings(locationId: string, patch: Partial<LocationSettings>): Promise<LocationSettings> {
    const body = { ...(patch.tone ? { defaultTone: toneToApi[patch.tone] } : {}), ...(patch.autoReply === undefined ? {} : { autoReplyEnabled: patch.autoReply }) };
    const result = await this.request<{ location: ApiLocation }>(`/api/v1/locations/${encodeURIComponent(locationId)}/settings`, { method: "PATCH", body: JSON.stringify(body) });
    return { tone: toneFromApi[result.location.tone], autoReply: result.location.autoReplyEnabled };
  }
  async logout() { await this.request<void>("/api/v1/logout", { method: "POST" }); this.csrfToken = ""; }

  private async request<T>(path: string, init: RequestInit = {}, retryCsrf = true): Promise<T> {
    const method = (init.method ?? "GET").toUpperCase(); const mutating = !["GET", "HEAD", "OPTIONS"].includes(method);
    // Native browser fetch requires the global receiver, not this service instance.
    const response = await this.fetcher.call(globalThis, `${this.baseUrl}${path}`, { ...init, credentials: "include", headers: { ...(init.body && !(init.body instanceof FormData) ? { "content-type": "application/json" } : {}), ...(mutating && this.csrfToken ? { "x-csrf-token": this.csrfToken } : {}), ...init.headers } });
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as ApiErrorBody;
      const error = new ReviewsManagerApiError(response.status, body.error?.code ?? "HTTP_ERROR", body.error?.message ?? "הבקשה נכשלה", body.error?.requestId);
      if (retryCsrf && mutating && error.code === "CSRF_INVALID") { await this.getSession(); return this.request<T>(path, init, false); }
      throw error;
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }
}

function clone<T>(value: T): T { return structuredClone(value); }
function notFound(entity: string, id: string): Error { return new Error(`${entity} לא נמצא (${id})`); }

export class MockReviewsManagerService implements ReviewsManagerService {
  private reviews = clone(initialReviews); private posts = clone(initialPosts); private settings = clone(initialSettings);
  async getSession(): Promise<SessionUser> { return { id: "mock-user", email: "admin@revu.local", displayName: "מיכל כהן", role: "ADMIN", capabilities: ["READ_REVIEWS", "REPLY_TO_REVIEWS", "PUBLISH_POSTS", "AUTO_REPLY"], connection: { status: "CONNECTED", googleEmail: "demo@revu.local" } }; }
  async getOnboarding(): Promise<OnboardingState> { return { step: "COMPLETE", readOnly: false, capabilities: ["READ_REVIEWS", "REPLY_TO_REVIEWS", "PUBLISH_POSTS", "AUTO_REPLY"], connection: { id: "demo", email: "demo@revu.local", status: "CONNECTED", lastError: null }, selectedLocationCount: mockLocations.length, syncedLocationCount: mockLocations.length, lastSyncAt: Date.now() }; }
  async getGoogleCandidates() { return { connections: [] as GoogleConnectionCandidates[] }; }
  async selectGoogleLocations(resourceNames: string[]) { void resourceNames; return this.getOnboarding(); }
  async syncGoogleReviews() { return this.getOnboarding(); }
  async disconnectGoogle() {}
  async getLocations() { return clone({ locations: mockLocations, settings: this.settings }); }
  async getOverviewStats(locationId?: string): Promise<OverviewStats> {
    const values = this.reviews.filter((review) => !locationId || review.locationId === locationId); const answered = values.filter((review) => review.status === "approved" || review.status === "auto-sent").length;
    return { totalReviews: values.length, averageRating: Number((values.reduce((sum, review) => sum + review.rating, 0) / (values.length || 1)).toFixed(1)), responseRate: values.length ? Math.round(answered / values.length * 100) : 0, pendingApprovalCount: values.filter((review) => review.status === "pending").length };
  }
  async getReviews(query: ReviewQuery = {}): Promise<Page<Review>> {
    let values = this.reviews.filter((review) => (!query.locationId || review.locationId === query.locationId) && (!query.status || review.status === "pending") && (!query.q || `${review.customerName} ${review.text}`.includes(query.q)));
    const start = query.cursor ? Math.max(0, values.findIndex((value) => value.id === query.cursor) + 1) : 0; const limit = query.limit ?? 25; values = values.slice(start, start + limit + 1);
    return clone({ items: values.slice(0, limit), nextCursor: values.length > limit ? values[limit - 1].id : null });
  }
  async getPosts(query: PostQuery = {}): Promise<Page<GooglePost>> {
    let values = this.posts.filter((post) => !query.locationId || post.locationId === query.locationId); const start = query.cursor ? Math.max(0, values.findIndex((value) => value.id === query.cursor) + 1) : 0; const limit = query.limit ?? 25; values = values.slice(start, start + limit + 1);
    return clone({ items: values.slice(0, limit), nextCursor: values.length > limit ? values[limit - 1].id : null });
  }
  async approveReview(id: string): Promise<Review> { const review = this.reviews.find((item) => item.id === id); if (!review) throw notFound("הביקורת", id); review.status = "approved"; return clone(review); }
  async saveReview(id: string, input: SaveReviewInput): Promise<Review> { const review = this.reviews.find((item) => item.id === id); if (!review) throw notFound("הביקורת", id); review.aiResponse = input.response; if (input.approve) review.status = "approved"; return clone(review); }
  async deleteReview(id: string): Promise<void> { if (!this.reviews.some((item) => item.id === id)) throw notFound("הביקורת", id); this.reviews = this.reviews.filter((item) => item.id !== id); }
  async createPost(input: CreatePostInput): Promise<GooglePost> { const post: GooglePost = { id: `p-${Date.now()}`, locationId: input.locationId, type: "update", text: `חדש אצלנו: ${input.brief}`, brief: input.brief, autoRenew: input.autoRenew, frequencyDays: input.frequencyDays, nextPublishAt: input.publishAt ?? new Date().toISOString(), status: "scheduled", publishedAt: null }; this.posts.unshift(post); return clone(post); }
  async changePostStatus(id: string, status: PostStatus): Promise<GooglePost> { const post = this.posts.find((item) => item.id === id); if (!post) throw notFound("הפוסט", id); post.status = status; return clone(post); }
  async retryPost(id: string): Promise<GooglePost> { const post = this.posts.find((item) => item.id === id); if (!post) throw notFound("הפוסט", id); post.status = "scheduled"; post.failureMessage = null; return clone(post); }
  async updateLocationSettings(locationId: string, patch: Partial<LocationSettings>): Promise<LocationSettings> { const current = this.settings[locationId]; if (!current) throw notFound("העסק", locationId); this.settings[locationId] = { ...current, ...patch }; return clone(this.settings[locationId]); }
  async logout() {}
  getLoginUrl() { return "/auth/google/start"; }
  getGoogleBusinessConnectUrl() { return "/api/v1/google-business/connect"; }
  getAuthMode() { return "dev" as const; }
}

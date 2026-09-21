import { describe, expect, it, vi } from "vitest";
import { HttpReviewsManagerService, MockReviewsManagerService, ReviewsManagerApiError } from "../src/services/reviewsManager";

describe("MockReviewsManagerService", () => {
  it("returns immutable paginated snapshots", async () => {
    const service = new MockReviewsManagerService();
    const first = await service.getReviews();
    first.items[0].customerName = "שונה";
    const second = await service.getReviews();
    expect(second.items[0].customerName).toBe("נועה לוי");
  });

  it("supports review, post, and settings mutations", async () => {
    const service = new MockReviewsManagerService();
    expect((await service.approveReview("r2")).status).toBe("approved");
    expect((await service.saveReview("r4", { response: "תגובה חדשה", approve: false })).aiResponse).toBe("תגובה חדשה");
    const post = await service.createPost({ locationId: "eli", type: "update", text: "פוסט בדיקה חדש", autoRenew: true });
    expect((await service.changePostStatus(post.id, "paused")).status).toBe("paused");
    expect((await service.updateLocationSettings("eli", { tone: "short" })).tone).toBe("short");
    await service.deleteReview("r7");
    expect((await service.getReviews()).items.some((review) => review.id === "r7")).toBe(false);
  });

  it("rejects operations for unknown records", async () => {
    const service = new MockReviewsManagerService();
    await expect(service.approveReview("missing")).rejects.toThrow("לא נמצא");
    await expect(service.changePostStatus("missing", "paused")).rejects.toThrow("לא נמצא");
  });
});

describe("HttpReviewsManagerService", () => {
  it("calls browser fetch with its required global receiver", async () => {
    const browserFetch = function (this: unknown) {
      if (this !== globalThis) throw new TypeError("Illegal invocation");
      return Promise.resolve(new Response(JSON.stringify({
        user: { id: "u", email: "admin@revu.local", displayName: "מנהל מקומי", role: "ADMIN" },
        csrfToken: "csrf",
      }), { status: 200 }));
    } as typeof fetch;
    const service = new HttpReviewsManagerService("", browserFetch);
    await expect(service.getSession()).resolves.toMatchObject({ id: "u" });
  });

  it("maps API data, encodes list queries, and includes credentials", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      reviews: [{ id: "r1", locationId: "eli", locationName: "מספרת אלי", reviewerName: "נועה", rating: 5, text: "מצוין", aiResponse: null, publishedReply: "תודה", status: "AUTO_SENT", date: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-01T10:00:00.000Z" }],
      nextCursor: "r1",
    }), { status: 200, headers: { "content-type": "application/json" } }));
    const service = new HttpReviewsManagerService("http://api.test/", fetcher);
    const page = await service.getReviews({ locationId: "eli", q: "נועה לוי", limit: 25 });
    expect(page.items[0]).toMatchObject({ customerName: "נועה", aiResponse: "תודה", status: "auto-sent" });
    expect(page.nextCursor).toBe("r1");
    expect(fetcher).toHaveBeenCalledWith("http://api.test/api/v1/reviews?locationId=eli&q=%D7%A0%D7%95%D7%A2%D7%94+%D7%9C%D7%95%D7%99&limit=25", expect.objectContaining({ credentials: "include" }));
  });

  it("refreshes and retries a mutation once when the CSRF token is stale", async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "u", email: "a@b.co", displayName: "א", role: "ADMIN" }, csrfToken: "old" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: "CSRF_INVALID", message: "פג" } }), { status: 403 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "u", email: "a@b.co", displayName: "א", role: "ADMIN" }, csrfToken: "new" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const service = new HttpReviewsManagerService("http://api.test", fetcher);
    await service.getSession(); await service.deleteReview("r1");
    expect(fetcher).toHaveBeenNthCalledWith(4, "http://api.test/api/v1/reviews/r1", expect.objectContaining({ headers: expect.objectContaining({ "x-csrf-token": "new" }) }));
  });

  it("surfaces the backend error envelope", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: { code: "REVIEW_NOT_FOUND", message: "הביקורת לא נמצאה", requestId: "req-1" } }), { status: 404 }));
    const service = new HttpReviewsManagerService("http://api.test", fetcher);
    await expect(service.approveReview("missing")).rejects.toEqual(expect.objectContaining<Partial<ReviewsManagerApiError>>({ status: 404, code: "REVIEW_NOT_FOUND", requestId: "req-1" }));
  });

  it("saves a draft before submitting it for approval", async () => {
    const apiReview = { id: "r1", locationId: "eli", locationName: "מספרת אלי", reviewerName: "נועה", rating: 5, text: "מצוין", aiResponse: "תודה", publishedReply: null, status: "PENDING_APPROVAL", date: "2026-09-01T10:00:00.000Z", updatedAt: "2026-09-01T10:00:00.000Z" };
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "u", email: "a@b.co", displayName: "א", role: "ADMIN" }, csrfToken: "csrf" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ review: apiReview }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "r1", status: "APPROVING" }), { status: 202 }));
    const service = new HttpReviewsManagerService("http://api.test", fetcher);
    await service.getSession();
    expect(await service.saveReview("r1", { response: "תודה", approve: true })).toMatchObject({ id: "r1", status: "approving" });
    expect(fetcher.mock.calls[1][0]).toBe("http://api.test/api/v1/reviews/r1/draft");
    expect(fetcher.mock.calls[2][0]).toBe("http://api.test/api/v1/reviews/r1/approve");
  });
});

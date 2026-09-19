import { describe, expect, it } from "vitest";
import { MockReviewsManagerService } from "../src/services/reviewsManager";

describe("MockReviewsManagerService", () => {
  it("returns immutable bootstrap snapshots", async () => {
    const service = new MockReviewsManagerService();
    const first = await service.load();
    first.reviews[0].customerName = "שונה";
    const second = await service.load();
    expect(second.reviews[0].customerName).toBe("נועה לוי");
  });

  it("supports review, post, and settings mutations", async () => {
    const service = new MockReviewsManagerService();
    expect((await service.approveReview("r2")).status).toBe("approved");
    expect((await service.saveReview("r4", { response: "תגובה חדשה", approve: false })).aiResponse).toBe("תגובה חדשה");
    const post = await service.createPost({ locationId: "eli", type: "update", text: "פוסט בדיקה חדש", autoRenew: true });
    expect((await service.changePostStatus(post.id, "paused")).status).toBe("paused");
    expect((await service.updateLocationSettings("eli", { tone: "short" })).tone).toBe("short");
    await service.deleteReview("r7");
    expect((await service.load()).reviews.some((review) => review.id === "r7")).toBe(false);
  });

  it("rejects operations for unknown records", async () => {
    const service = new MockReviewsManagerService();
    await expect(service.approveReview("missing")).rejects.toThrow("לא נמצא");
    await expect(service.changePostStatus("missing", "paused")).rejects.toThrow("לא נמצא");
  });
});

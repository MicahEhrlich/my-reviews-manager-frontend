import {
  initialPosts,
  initialReviews,
  initialSettings,
  locations,
  type GooglePost,
  type Location,
  type LocationSettings,
  type PostStatus,
  type PostType,
  type Review,
} from "../mockData";

export interface BootstrapData {
  locations: Location[];
  reviews: Review[];
  posts: GooglePost[];
  settings: Record<string, LocationSettings>;
}

export interface SaveReviewInput {
  response: string;
  approve: boolean;
}

export interface CreatePostInput {
  locationId: string;
  type: PostType;
  text: string;
  imageUrl?: string;
  autoRenew: boolean;
}

export interface ReviewsManagerService {
  load(): Promise<BootstrapData>;
  approveReview(id: string): Promise<Review>;
  saveReview(id: string, input: SaveReviewInput): Promise<Review>;
  deleteReview(id: string): Promise<void>;
  createPost(input: CreatePostInput): Promise<GooglePost>;
  changePostStatus(id: string, status: PostStatus): Promise<GooglePost>;
  updateLocationSettings(locationId: string, patch: Partial<LocationSettings>): Promise<LocationSettings>;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function notFound(entity: string, id: string): Error {
  return new Error(`${entity} לא נמצא (${id})`);
}

export class MockReviewsManagerService implements ReviewsManagerService {
  private reviews = clone(initialReviews);
  private posts = clone(initialPosts);
  private settings = clone(initialSettings);

  async load(): Promise<BootstrapData> {
    return clone({ locations, reviews: this.reviews, posts: this.posts, settings: this.settings });
  }

  async approveReview(id: string): Promise<Review> {
    const review = this.reviews.find((item) => item.id === id);
    if (!review) throw notFound("הביקורת", id);
    Object.assign(review, { status: "approved" as const, responseMinutes: 1 });
    return clone(review);
  }

  async saveReview(id: string, input: SaveReviewInput): Promise<Review> {
    const review = this.reviews.find((item) => item.id === id);
    if (!review) throw notFound("הביקורת", id);
    review.aiResponse = input.response;
    if (input.approve) Object.assign(review, { status: "approved" as const, responseMinutes: 1 });
    return clone(review);
  }

  async deleteReview(id: string): Promise<void> {
    if (!this.reviews.some((item) => item.id === id)) throw notFound("הביקורת", id);
    this.reviews = this.reviews.filter((item) => item.id !== id);
  }

  async createPost(input: CreatePostInput): Promise<GooglePost> {
    const post: GooglePost = {
      ...input,
      id: `p-${Date.now()}`,
      status: "published",
      publishedAt: new Date().toISOString().slice(0, 10),
    };
    this.posts.unshift(post);
    return clone(post);
  }

  async changePostStatus(id: string, status: PostStatus): Promise<GooglePost> {
    const post = this.posts.find((item) => item.id === id);
    if (!post) throw notFound("הפוסט", id);
    post.status = status;
    return clone(post);
  }

  async updateLocationSettings(locationId: string, patch: Partial<LocationSettings>): Promise<LocationSettings> {
    const current = this.settings[locationId];
    if (!current) throw notFound("העסק", locationId);
    this.settings[locationId] = { ...current, ...patch };
    return clone(this.settings[locationId]);
  }
}

import { Star } from "lucide-react";

export interface StarsProps {
  rating: number;
  size?: number;
}

export function Stars({ rating, size = 16 }: StarsProps) {
  return <span className="stars" aria-label={`${rating} מתוך 5 כוכבים`} dir="ltr">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={size} fill={star <= rating ? "currentColor" : "none"} />)}</span>;
}

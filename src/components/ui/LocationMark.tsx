import type { Location as BusinessLocation } from "../../mockData";

export interface LocationMarkProps {
  locationId: string;
  locations: BusinessLocation[];
  compact?: boolean;
}

export function LocationMark({ locationId, locations, compact = false }: LocationMarkProps) {
  const business = locations.find((item) => item.id === locationId);
  if (!business) return <span className="location-mark"><span className="location-dot">?</span></span>;
  return <span className={`location-mark ${compact ? "compact" : ""}`}><span className="location-dot" style={{ background: business.color }}>{business.name.charAt(0)}</span>{!compact && <span><strong>{business.name}</strong><small>{business.category}</small></span>}</span>;
}

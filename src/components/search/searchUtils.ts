export interface RecentSearch {
  id: string;
  type: "trail" | "quest" | "user" | "action";
  label: string;
  icon: string;
  timestamp: number;
}

const RECENT_SEARCHES_KEY = "global-search-history";
const MAX_RECENT_SEARCHES = 5;

export function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveRecentSearch(search: Omit<RecentSearch, "timestamp">): RecentSearch[] {
  const searches = getRecentSearches();
  const filtered = searches.filter(s => !(s.id === search.id && s.type === search.type));
  const updated = [{ ...search, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

export function removeRecentSearch(id: string, type: string): RecentSearch[] {
  const searches = getRecentSearches();
  const updated = searches.filter(s => !(s.id === id && s.type === type));
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  return updated;
}

export function clearRecentSearches(): RecentSearch[] {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
  return [];
}

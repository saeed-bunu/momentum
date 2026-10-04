export type Book = {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  subject?: string[];
};

type OpenLibraryResponse = {
  docs?: Book[];
};

function normalizeWords(value: string): string[] {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function matchesSkill(value: string, skill: string): boolean {
  const skillWords = normalizeWords(skill);
  const resultWords = new Set(normalizeWords(value));
  return skillWords.length > 0 && skillWords.every((word) => resultWords.has(word));
}

export async function findBooks(skill: string, level: string, signal: AbortSignal): Promise<Book[]> {
  const params = new URLSearchParams({
    q: `${skill} ${level} books`,
    limit: "30",
    fields: "title,author_name,cover_i,key,subject",
  });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
  if (!response.ok) {
    throw new Error("Book search is unavailable right now.");
  }

  const data = (await response.json()) as OpenLibraryResponse;
  return (data.docs ?? [])
    .filter((book) => matchesSkill(`${book.title} ${(book.subject ?? []).join(" ")}`, skill))
    .slice(0, 5);
}

export function getYouTubeSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}

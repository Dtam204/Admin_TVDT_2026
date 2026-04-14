# READER FE QUICK COPY (1-PAGE HANDOFF)

Muc tieu: Team FE copy nhanh de len man Reader voi 3 mode doc:
- Page: PDF
- Chapter: jump theo TOC PDF
- Scroll: fulltext (html/text)

Nguon contract: READER_READING_SYNC_API_GUIDE.md

## 1) API dung ngay

- GET /api/public/publications/{id_or_slug}
  - Tra ve publication detail + reading_content + readingProgress (neu co token)
- POST /api/reader/actions/progress
  - Luu tien do doc
- GET /api/reader/actions/progress/{bookId}
  - Lay tien do rieng (optional)

## 2) TypeScript types (copy)

~~~ts
export type ReadingMode = "page" | "chapter" | "scroll";

export interface ReadingContent {
  can_read: boolean;
  source_policy: {
    page: "pdf";
    chapter: "pdf";
    scroll: "fulltext";
  };
  available_modes: ReadingMode[];
  default_mode: ReadingMode | null;
  page_mode: {
    enabled: boolean;
    pdf_url: string | null;
    pdf_asset?: {
      download_url: string | null;
      download_url_absolute?: string | null;
      pdf_url_absolute?: string | null;
      file_hash: string | null;
      version: string | null;
      file_size: number | null;
      updated_at: string | null;
      mime_type: string;
      supports_range: boolean;
    } | null;
    total_pages: number;
    preview_source?: "pdf_pages";
    preview_images_ready?: boolean;
    preview_pages: Array<{ index: number; label: string; value: number | string }>;
  };
  chapter_mode: {
    enabled: boolean;
    total_chapters: number;
    chapters: Array<{
      id: string;
      title: string;
      order: number;
      start_page: number;
      end_page: number;
      page_range: string;
    }>;
  };
  scroll_mode: {
    enabled: boolean;
    full_text: {
      enabled: boolean;
      format: "html" | "text" | null;
      content: string;
      word_count: number;
      excerpt: string;
    };
  };
}

export interface ReadingProgress {
  last_page: number;
  progress_percent: number;
  is_finished: boolean;
  mode_progress?: Partial<Record<ReadingMode, {
    read_mode: ReadingMode;
    last_page: number | null;
    progress_percent: number;
    scroll_percent: number | null;
    scroll_offset: number | null;
    is_finished: boolean;
  }>>;
  preferred_mode?: ReadingMode;
}

export interface PublicationDetailResponse {
  success: boolean;
  code: number;
  message: string;
  data: {
    id: number;
    title: string;
    author: string;
    access_policy?: "basic" | "premium" | "vip" | string;
    reading_content: ReadingContent;
    readingProgress?: ReadingProgress | null;
  };
}
~~~

## 3) API client (copy)

~~~ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getPublicationDetail(idOrSlug: string | number, token?: string) {
  const res = await fetch(`${API_BASE}/api/public/publications/${idOrSlug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(token),
    },
    cache: "no-store",
  });

  const json = (await res.json()) as PublicationDetailResponse;
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Load publication detail failed");
  }
  return json.data;
}

export async function saveReadingProgress(input: {
  token: string;
  bookId: number;
  readMode: ReadingMode;
  lastPage: number;
  progressPercent: number;
  scrollPercent?: number | null;
  scrollOffset?: number | null;
  isFinished: boolean;
}) {
  const res = await fetch(`${API_BASE}/api/reader/actions/progress`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.token}`,
    },
    body: JSON.stringify({
      bookId: input.bookId,
      readMode: input.readMode,
      lastPage: input.lastPage,
      progressPercent: input.progressPercent,
      scrollPercent: input.scrollPercent ?? null,
      scrollOffset: input.scrollOffset ?? null,
      isFinished: input.isFinished,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.message || "Save progress failed");
  }
  return json;
}
~~~

## 4) Reader screen flow (copy logic)

~~~ts
// 1) On mount:
// - call getPublicationDetail(id)
// - set mode = reading_content.default_mode ?? reading_content.available_modes[0]
// - set currentPage = readingProgress?.last_page ?? 1

// 2) Render tab by mode:
// page    -> PDF viewer + total_pages
// chapter -> chapter list, on click jump PDF page start_page
// scroll  -> html/text renderer from full_text

// 2.1) Offline PDF first-load:
// - uu tien tai file qua page_mode.pdf_asset.download_url (path tuong doi)
// - neu khong co, fallback page_mode.pdf_url
// - neu can debug backend tra URL absolute, doc them *_absolute
// - so sanh file_hash/version de quyet dinh dung cache hay tai moi
// - page_mode.preview_source = 'pdf_pages': du lieu la danh sach trang PDF, khong phai preview anh

// 3) Guard tab visibility:
// hide Page tab if page_mode.enabled = false
// hide Chapter tab if chapter_mode.enabled = false
// hide Scroll tab if scroll_mode.enabled = false

// 4) Progress update (debounce 1200ms):
// - Page/Chapter mode: gui readMode='page'|'chapter', uu tien lastPage
// - Scroll mode: gui readMode='scroll', uu tien scrollPercent/scrollOffset
// - Backend uu tien resume theo PDF (page -> chapter -> scroll)
~~~

## 5) React mini hook (copy)

~~~ts
import { useEffect, useMemo, useRef, useState } from "react";

export function useReaderState(publicationId: string, token?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<number | null>(null);
  const [readingContent, setReadingContent] = useState<ReadingContent | null>(null);
  const [mode, setMode] = useState<ReadingMode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicationDetail(publicationId, token);
        setBookId(data.id);
        setReadingContent(data.reading_content);
        const initialMode = data.reading_content.default_mode || data.reading_content.available_modes?.[0] || null;
        setMode(initialMode);
        setCurrentPage(data.readingProgress?.last_page || 1);
      } catch (e: any) {
        setError(e?.message || "Load reader failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [publicationId, token]);

  const totalPages = useMemo(() => readingContent?.page_mode?.total_pages || 0, [readingContent]);

  const pushProgress = (nextPage: number) => {
    setCurrentPage(nextPage);
    if (!token || !bookId || !totalPages) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const progressPercent = Math.min(100, (nextPage / totalPages) * 100);
      saveReadingProgress({
        token,
        bookId,
        readMode: mode || "page",
        lastPage: nextPage,
        progressPercent,
        isFinished: progressPercent >= 100,
      }).catch(() => {});
    }, 1200);
  };

  return {
    loading,
    error,
    readingContent,
    mode,
    setMode,
    currentPage,
    totalPages,
    pushProgress,
  };
}
~~~

## 6) UI mapping nhanh

- Header Trang x/y:
  - x = currentPage
  - y = reading_content.page_mode.total_pages
- Chapter item:
  - title = chapter.title
  - subtitle = Tr. start_page-end_page
- Scroll mode:
  - format = html -> render HTML component
  - format = text -> render plain text

## 7) Rule xu ly loi (bat buoc)

- Neu reading_content.can_read = false:
  - Hien paywall/upgrade theo access_policy
  - Khong render noi dung doc
- Neu mode hien tai khong con trong available_modes:
  - fallback ve mode dau tien
- Neu khong co total_pages:
  - khong tinh progress theo page

## 8) Smoke test 5 phut cho FE

1. Sach co PDF -> thay tab Page
2. Sach co TOC -> thay tab Chapter
3. Sach co fulltext -> thay tab Scroll
4. Doc den page 27 -> reload -> resume dung page 27
5. Den 100% -> isFinished true

## 9) Notes quan trong

- Backend mount progress route tai /api/reader/actions/progress
- Neu token het han: cho phep doc public detail, nhung bo qua save progress
- Nen save progress theo debounce, khong goi moi lan scroll/page event

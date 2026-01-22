# Frontend Performance Optimization Guide

## 🚀 Quick Start

### 1. Install new dependencies

```bash
cd frontend
npm install
```

Đã thêm:
- `@tanstack/react-query` - Server state management với caching

### 2. Wrap app với QueryProvider

Update `app/layout.tsx`:

```tsx
import { QueryProvider } from '@/lib/providers/QueryProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
```

### 3. Use React Query hooks

Thay vì fetch thủ công, dùng hooks có sẵn:

```tsx
// Old way (manual fetch)
const [news, setNews] = useState([]);
useEffect(() => {
  fetch('/api/admin/news')
    .then(r => r.json())
    .then(data => setNews(data));
}, []);

// New way (React Query)
import { useNews } from '@/lib/hooks/useNews';

const { data: news, isLoading, error } = useNews();
```

---

## 📊 Optimizations Implemented

### 1. React Query Caching

**Benefits:**
- ✅ Automatic caching (5 minutes stale time)
- ✅ Background refetching
- ✅ Deduplication (same request only fires once)
- ✅ Optimistic updates
- ✅ Automatic retry on failure

**Usage Example:**

```tsx
import { useNews, useCreateNews, useUpdateNews, useDeleteNews } from '@/lib/hooks/useNews';

function NewsPage() {
  const { data: news, isLoading } = useNews();
  const createMutation = useCreateNews();
  const updateMutation = useUpdateNews();
  const deleteMutation = useDeleteNews();

  const handleCreate = async (formData) => {
    await createMutation.mutateAsync(formData);
    // List tự động refetch, không cần manual setState!
  };

  const handleUpdate = async (id, formData) => {
    await updateMutation.mutateAsync({ id, data: formData });
  };

  const handleDelete = async (id) => {
    await deleteMutation.mutateAsync(id);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      {news?.map(item => (
        <NewsCard key={item.id} data={item} />
      ))}
    </div>
  );
}
```

### 2. Next.js Config Optimizations

**Đã cấu hình:**
- ✅ Image optimization (AVIF, WebP)
- ✅ Remove console.logs trong production
- ✅ Optimize package imports (lucide-react, recharts)
- ✅ Response compression
- ✅ Tree shaking
- ✅ Bundle analyzer

**Chạy bundle analyzer:**

```bash
npm run analyze
```

### 3. Code Splitting

**Lazy loading components:**

```tsx
import dynamic from 'next/dynamic';

// Lazy load heavy components
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <Spinner />,
  ssr: false, // Nếu component không cần SSR
});

function Dashboard() {
  return (
    <div>
      <HeavyChart data={data} />
    </div>
  );
}
```

### 4. Memoization

**Optimize renders:**

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memo component to prevent re-renders
export const NewsCard = memo(({ data }) => {
  return <div>{data.title}</div>;
});

// Memo expensive calculations
function NewsPage() {
  const filteredNews = useMemo(() => {
    return news.filter(item => item.status === 'published');
  }, [news]);

  const handleClick = useCallback((id) => {
    // Handle click
  }, []);

  return <div>...</div>;
}
```

---

## 🎯 Performance Targets

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| First Contentful Paint | ~2-3s | <1.5s | **50%** |
| Largest Contentful Paint | ~3-4s | <2.5s | **37%** |
| Time to Interactive | ~3-5s | <3s | **40%** |
| Bundle size (JS) | ~500KB | <300KB | **40%** |
| API calls (duplicate) | Many | Minimal | **80%** |
| Cache hit rate | 0% | >60% | **NEW** |

---

## 📈 Best Practices

### 1. Server Components First

```tsx
// ✅ Good - Server Component (default)
async function NewsPage() {
  const news = await fetch('/api/admin/news');
  return <NewsList data={news} />;
}

// ❌ Bad - Unnecessary client component
'use client';
function NewsPage() {
  const [news, setNews] = useState([]);
  useEffect(() => {
    fetch('/api/admin/news').then(r => setNews(r));
  }, []);
  return <NewsList data={news} />;
}
```

### 2. Image Optimization

```tsx
import Image from 'next/image';

// ✅ Good - Next.js Image
<Image
  src="/images/hero.jpg"
  alt="Hero"
  width={1920}
  height={1080}
  priority // For above-fold images
/>

// ❌ Bad - Regular img tag
<img src="/images/hero.jpg" alt="Hero" />
```

### 3. Font Optimization

```tsx
import { Plus_Jakarta_Sans } from 'next/font/google';

const font = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  display: 'swap', // ✅ Prevent layout shift
  preload: true,   // ✅ Preload font
});
```

### 4. Avoid Layout Shifts

```tsx
// ✅ Good - Fixed dimensions
<div className="w-full h-64">
  {isLoading ? <Skeleton /> : <Content />}
</div>

// ❌ Bad - Height jumps
<div className="w-full">
  {isLoading ? <Spinner /> : <Content />}
</div>
```

---

## 🔧 Tools & Commands

### Analyze Bundle Size

```bash
npm run analyze
```

Opens `analyze.html` showing:
- Bundle composition
- Large dependencies
- Duplicate modules

### Lighthouse Audit

```bash
# Install lighthouse CLI
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000/admin --view
```

### Check for unused dependencies

```bash
npx depcheck
```

---

## 📝 Refactoring Recommendations

### Split Large Components

**Homepage Admin (3100+ dòng) → Split into:**

```
components/admin/homepage/
├── HomePageEditor.tsx          // Main container
├── blocks/
│   ├── HeroBlockEditor.tsx
│   ├── FeaturesBlockEditor.tsx
│   ├── SolutionsBlockEditor.tsx
│   ├── TrustsBlockEditor.tsx
│   ├── TestimonialsBlockEditor.tsx
│   └── ConsultBlockEditor.tsx
├── shared/
│   ├── BlockHeader.tsx
│   ├── LocaleInputGroup.tsx
│   └── ArrayItemEditor.tsx
└── hooks/
    ├── useHomepageBlock.ts
    └── useBlockTranslation.ts
```

**Benefits:**
- Mỗi file ~200-400 dòng
- Dễ maintain
- Reusable components
- Better TypeScript inference
- Easier testing

### Extract Common Patterns

```tsx
// lib/utils/admin-helpers.ts
export function getBlockData(block: any, path: string, defaultValue: any = '') {
  const keys = path.split('.');
  let current = block?.data;
  for (const key of keys) {
    if (!current) return defaultValue;
    if (key.includes('[') && key.includes(']')) {
      const arrayKey = key.substring(0, key.indexOf('['));
      const index = Number(key.substring(key.indexOf('[') + 1, key.indexOf(']')));
      current = current[arrayKey]?.[index];
    } else {
      current = current[key];
    }
  }
  return current ?? defaultValue;
}
```

---

## 🎯 Next Steps

1. ✅ Install dependencies
2. ✅ Add QueryProvider to layout
3. 🔲 Migrate News page to use React Query hooks
4. 🔲 Split homepage admin component
5. 🔲 Implement lazy loading for heavy components
6. 🔲 Add proper loading states everywhere
7. 🔲 Optimize images with next/image
8. 🔲 Add error boundaries

---

**Status:** ✅ Ready for implementation

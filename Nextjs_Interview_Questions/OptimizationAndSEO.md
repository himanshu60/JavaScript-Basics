# Next.js Optimization - Images, Fonts, Metadata and SEO

---

# PART 1 — Image Optimization

## 1. What is `next/image`?

**Definition:** `next/image` is a built-in component that replaces the plain `<img>` tag and automatically handles resizing, modern formats, lazy loading and layout-shift prevention.

**What it does for you automatically:**

| Feature | Definition |
|---|---|
| **Format conversion** | Serves WebP or AVIF to browsers that support them (much smaller than JPG/PNG) |
| **Responsive sizing** | Generates several sizes and serves the right one for the device |
| **Lazy loading** | Images below the fold load only when the user scrolls near them |
| **No layout shift** | Reserves the exact space before the image loads |
| **Blur placeholder** | Shows a tiny blurred version while the real image loads |

```jsx
import Image from "next/image";

<Image
  src="/hero.jpg"
  alt="Hero banner"
  width={1200}
  height={600}
  priority               // load immediately - use for above-the-fold images
/>
```

---

## 2. Image sizing options

**Definition of `width`/`height`:** Required for local images (unless using `fill`). They set the **aspect ratio**, which is what prevents layout shift — not necessarily the display size.

**Definition of `fill`:** The image fills its parent container. The parent must have `position: relative` and a defined size.

```jsx
// Fixed size
<Image src="/logo.png" alt="Logo" width={200} height={50} />

// Fill the parent container
<div style={{ position: "relative", width: "100%", height: "400px" }}>
  <Image src="/banner.jpg" alt="Banner" fill style={{ objectFit: "cover" }} />
</div>

// Responsive with sizes - tells the browser which width to download
<Image
  src="/photo.jpg"
  alt="Photo"
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>
```

**Definition of `sizes`:** Tells the browser how wide the image will actually be displayed at each breakpoint, so it downloads the smallest adequate file. Without it, the browser may download a huge image for a small thumbnail.

---

## 3. Placeholders and external images

```jsx
// Blur placeholder - automatic for imported local images
import heroImg from "@/public/hero.jpg";
<Image src={heroImg} alt="Hero" placeholder="blur" />

// For remote images you must supply the blur data yourself
<Image
  src="https://cdn.com/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
/>
```

**External domains must be allowed in the config:**

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.example.com", pathname: "/images/**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
};
```

**Image best practices:**
- Add `priority` to the **LCP image** (the big one visible on first load) — never to more than one or two.
- Always write a meaningful `alt` for accessibility and SEO.
- Always provide `sizes` when using `fill`.
- Do **not** add `priority` to below-the-fold images; it defeats lazy loading.

---

# PART 2 — Font Optimization

## 4. What is `next/font`?

**Definition:** `next/font` downloads font files at **build time** and self-hosts them from your own domain. This removes the network request to Google, eliminates layout shift, and improves privacy.

```jsx
// app/layout.js
import { Inter, Roboto_Mono } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",              // show fallback text immediately, swap when ready
  variable: "--font-inter",     // expose it as a CSS variable
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Local fonts:**

```jsx
import localFont from "next/font/local";

const myFont = localFont({
  src: [
    { path: "./fonts/MyFont-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/MyFont-Bold.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
});
```

**Definition of CLS (Cumulative Layout Shift):** A Core Web Vital measuring how much content jumps around while loading. `next/font` automatically calculates a matching fallback font size, so text does not jump when the real font arrives.

---

# PART 3 — Metadata and SEO

## 5. Static metadata

**Definition:** Export a `metadata` object from a layout or page, and Next.js generates the correct `<head>` tags automatically.

```jsx
// app/layout.js
export const metadata = {
  title: {
    default: "My Site",
    template: "%s | My Site",      // child pages fill in the %s
  },
  description: "A great website built with Next.js",
  keywords: ["nextjs", "react", "web development"],
  authors: [{ name: "Himanshu" }],
  metadataBase: new URL("https://mysite.com"),

  openGraph: {
    title: "My Site",
    description: "A great website",
    url: "https://mysite.com",
    siteName: "My Site",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "My Site",
    description: "A great website",
    images: ["/twitter-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  alternates: {
    canonical: "https://mysite.com",
  },
};
```

**Definition of Open Graph:** A set of `<meta>` tags that control how your link looks when shared on Facebook, LinkedIn, WhatsApp and Slack — the title, description and preview image.

---

## 6. Dynamic metadata

**Definition:** `generateMetadata` is an async function that builds metadata from fetched data — essential for blog posts and product pages.

```jsx
// app/blog/[slug]/page.js
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return { title: "Not Found" };

  return {
    title: post.title,                  // becomes "Post Title | My Site"
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}
```

> The fetch inside `generateMetadata` is **deduplicated** with the one in your page component — it does not cause a second request.

---

## 7. sitemap.xml and robots.txt

**Definition of a sitemap:** A file listing all the URLs of your site so search engines can discover and index them efficiently.

```js
// app/sitemap.js
export default async function sitemap() {
  const posts = await getAllPosts();

  const postUrls = posts.map((post) => ({
    url: `https://mysite.com/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    { url: "https://mysite.com", lastModified: new Date(), priority: 1 },
    { url: "https://mysite.com/about", priority: 0.5 },
    ...postUrls,
  ];
}
```

**Definition of robots.txt:** A file telling search engine crawlers which paths they may and may not crawl.

```js
// app/robots.js
export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/"] },
    ],
    sitemap: "https://mysite.com/sitemap.xml",
  };
}
```

---

## 8. Structured data (JSON-LD)

**Definition:** JSON-LD is a structured format that tells search engines exactly what your content is (an article, a product, a recipe). It is what produces rich results — star ratings, prices and FAQ dropdowns in Google.

```jsx
export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductView product={product} />
    </>
  );
}
```

---

# PART 4 — Performance

## 9. Script optimization

**Definition:** `next/script` controls **when** a third-party script loads, so analytics and chat widgets do not block your page.

```jsx
import Script from "next/script";

<Script src="https://analytics.com/script.js" strategy="afterInteractive" />
```

| Strategy | Definition |
|---|---|
| `beforeInteractive` | Loads before any Next.js code — for critical polyfills or bot detection |
| `afterInteractive` | **Default.** Loads after the page becomes interactive — for analytics |
| `lazyOnload` | Loads during browser idle time — for chat widgets and social embeds |
| `worker` | Runs in a web worker (experimental) |

---

## 10. Environment variables

**Definition:** Variables in `.env.local` are available on the **server only**, unless prefixed with `NEXT_PUBLIC_`, which embeds them in the browser bundle.

```bash
# .env.local
DATABASE_URL="postgresql://..."           # server only - SAFE
API_SECRET="secret123"                    # server only - SAFE
NEXT_PUBLIC_API_URL="https://api.com"     # sent to the browser - NEVER put secrets here
```

```jsx
// Server Component / Route Handler / Server Action
const db = process.env.DATABASE_URL;            // ✅ works

// Client Component
const url = process.env.NEXT_PUBLIC_API_URL;    // ✅ works
const secret = process.env.API_SECRET;          // ❌ undefined in the browser
```

> ⚠️ Anything with `NEXT_PUBLIC_` is **visible to every visitor** in the JavaScript bundle. Never put API keys, database URLs or secrets there.

**File priority:** `.env.local` → `.env.development` / `.env.production` → `.env`. Always add `.env.local` to `.gitignore`.

---

## 11. Core Web Vitals

**Definition:** The three metrics Google uses to measure real user experience, and which directly affect search ranking.

| Metric | Definition | Good score | How Next.js helps |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | Time until the biggest element is visible | < 2.5s | SSG/ISR, `next/image` with `priority` |
| **INP** (Interaction to Next Paint) | Responsiveness to user input | < 200ms | Server Components ship less JavaScript |
| **CLS** (Cumulative Layout Shift) | How much content jumps around | < 0.1 | `next/image` dimensions, `next/font` |

**Measuring them:**

```bash
npm run build       # shows the bundle size for every route
npx @next/bundle-analyzer
```

Use **Lighthouse** in Chrome DevTools, and `reportWebVitals` for real-user data.

---

## 12. Optimization checklist

- [ ] Use `next/image` everywhere instead of `<img>`
- [ ] Add `priority` to the LCP image only
- [ ] Use `next/font` instead of a Google Fonts `<link>`
- [ ] Set `metadata` or `generateMetadata` on every page
- [ ] Add `sitemap.js` and `robots.js`
- [ ] Keep `"use client"` as low in the tree as possible
- [ ] Use `Suspense` to stream slow sections
- [ ] Use `Promise.all` to avoid fetch waterfalls
- [ ] Use SSG/ISR wherever the content is not personalised
- [ ] Load third-party scripts with `next/script` and the right strategy
- [ ] Check bundle size after every major dependency addition

---

## Key points

- `next/image` handles format conversion, resizing, lazy loading and layout shift automatically.
- `next/font` self-hosts fonts at build time, removing CLS and an external request.
- Export `metadata` for static SEO tags, or `generateMetadata` for dynamic pages.
- `sitemap.js`, `robots.js` and JSON-LD improve crawling and rich search results.
- Only `NEXT_PUBLIC_` variables reach the browser — never put secrets in them.
- Optimise for **LCP, INP and CLS**; Next.js is designed around these metrics.

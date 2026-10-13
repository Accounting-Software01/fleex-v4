"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft } from "lucide-react";

const TOPICS: Record<string, { label: string; emoji: string; gradient: string }> = {
  tech: { label: "Tech", emoji: "⚡", gradient: "from-[#1e3a8a] to-[#312e81]" },
  ai: { label: "AI", emoji: "🧠", gradient: "from-[#065f46] to-[#064e3b]" },
  design: { label: "Design", emoji: "🎨", gradient: "from-[#d97706] to-[#be123c]" },
  photography: { label: "Photography", emoji: "📷", gradient: "from-[#78350f] to-[#451a03]" },
  music: { label: "Music", emoji: "🎵", gradient: "from-[#4c1d95] to-[#3b0764]" },
  gaming: { label: "Gaming", emoji: "🎮", gradient: "from-[#0c4a6e] to-[#075985]" },
  food: { label: "Food", emoji: "🍜", gradient: "from-[#991b1b] to-[#7f1d1d]" },
  books: { label: "Books", emoji: "📚", gradient: "from-[#7c2d12] to-[#431407]" },
  art: { label: "Art", emoji: "🖼", gradient: "from-[#9d174d] to-[#831843]" },
  film: { label: "Film", emoji: "🎬", gradient: "from-[#111827] to-[#030712]" },
  travel: { label: "Travel", emoji: "✈️", gradient: "from-[#0369a1] to-[#075985]" },
  sports: { label: "Sports", emoji: "⚽", gradient: "from-[#15803d] to-[#14532d]" },
  news: { label: "News", emoji: "📰", gradient: "from-[#334155] to-[#1e293b]" },
  business: { label: "Business", emoji: "💼", gradient: "from-[#78350f] to-[#422006]" },
  culture: { label: "Culture", emoji: "🌍", gradient: "from-[#9f1239] to-[#881337]" },
  science: { label: "Science", emoji: "🔬", gradient: "from-[#0e7490] to-[#164e63]" },
  health: { label: "Health", emoji: "💚", gradient: "from-[#166534] to-[#14532d]" },
  nature: { label: "Nature", emoji: "🌿", gradient: "from-[#14532d] to-[#052e16]" },
  fashion: { label: "Fashion", emoji: "👗", gradient: "from-[#701a75] to-[#4a044e]" },
  heritage: { label: "Heritage", emoji: "🏛", gradient: "from-[#7c2d12] to-[#451a03]" },
};

const TEMPLATE_TO_TOPICS: Record<string, string[]> = {
  portfolio: ["design", "art"],
  gallery: ["art", "photography"],
  blog: ["books", "news", "culture"],
  shop: ["business", "fashion"],
  game: ["gaming"],
  custom: ["tech", "science"],
  donation: [],
};

const TAG_ALIASES: Record<string, string> = {
  aicreators: "ai", deepfakes: "ai", ml: "ai",
  africantech: "tech", opensource: "tech",
  futureofwork: "business",
};

function normalizeTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const found = new Set<string>();
  for (const tag of raw) {
    if (typeof tag !== "string") continue;
    const spaced = tag.replace(/^#/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/[^a-z]+/g, " ").trim();
    if (!spaced) continue;
    const wholeAlias = TAG_ALIASES[spaced.replace(/\s+/g, "")];
    if (wholeAlias) found.add(wholeAlias);
    for (const word of spaced.split(/\s+/)) {
      const alias = TAG_ALIASES[word];
      if (alias) found.add(alias);
      for (const key of Object.keys(TOPICS)) {
        if (key.length <= 3) {
          if (word === key || word === `${key}s`) found.add(key);
        } else if (word.includes(key)) {
          found.add(key);
        }
      }
    }
  }
  return [...found];
}

export default function TopicPage() {
  const router = useRouter();
  const params = useParams();
  const key = (params?.key as string) || "";
  const supabase = useMemo(() => createClient(), []);
  const meta = TOPICS[key];

  const [forges, setForges] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!meta) return;
    let cancelled = false;

    (async () => {
      const templates = Object.entries(TEMPLATE_TO_TOPICS)
        .filter(([, topics]) => topics.includes(key))
        .map(([t]) => t);

      const [forgesRes, feedsRes] = await Promise.all([
        templates.length
          ? supabase
              .from("forges")
              .select("id, name, description, template_type, user_id, created_at, config, profiles:user_id(id, username, display_name, avatar_url)")
              .eq("is_published", true)
              .in("template_type", templates)
              .order("created_at", { ascending: false })
              .limit(30)
          : Promise.resolve({ data: [] }),

        supabase
          .from("user_feeds")
          .select("id, title, content, media_url, media_type, user_id, created_at, tags, profiles:user_id(id, username, display_name, avatar_url)")
          .not("tags", "is", null)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (cancelled) return;

      const matchingPosts = (feedsRes.data ?? []).filter((p: any) =>
        normalizeTags(p.tags).includes(key)
      );

      setForges(forgesRes.data ?? []);
      setPosts(matchingPosts);
      setLoading(false);
    })().catch((e) => {
      console.error("[Topic] error:", e);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [supabase, key, meta]);

  if (!meta) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center p-6 text-center">
        <div>
          <p className="text-[15px] font-semibold">Unknown topic</p>
          <button onClick={() => router.back()} className="mt-4 rounded-full bg-[#14181c] px-5 py-2.5 text-[13px] font-semibold text-white">
            Go back
          </button>
        </div>
      </div>
    );
  }

  const empty = !loading && forges.length === 0 && posts.length === 0;

  return (
    <div className="min-h-[100dvh] w-full bg-white text-[#14181c] antialiased">
      <header
        className="sticky top-0 z-30 border-b border-[#ecebe5] bg-white/90 backdrop-blur-xl"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex h-11 max-w-3xl items-center px-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="grid h-9 w-9 place-items-center rounded-full transition active:scale-95 active:bg-black/5"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <h1 className="ml-2 text-[16px] font-semibold tracking-[-0.01em]">
            {meta.emoji} {meta.label}
          </h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        {loading ? (
          <p className="py-12 text-center text-[13px] text-[#8b8f8a]">Loading…</p>
        ) : empty ? (
          <div className="py-16 text-center">
            <div className={`mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br ${meta.gradient} text-[28px]`}>
              {meta.emoji}
            </div>
            <p className="text-[15px] font-semibold">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-[280px] text-[13px] leading-[1.5] text-[#7d8387]">
              Be the first to publish a {meta.label} Forge or tag a post with {key}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {forges.length > 0 && (
              <section>
                <h2 className="mb-3 text-[15px] font-semibold">Forges</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {forges.map((f) => {
                    const owner = Array.isArray(f.profiles) ? f.profiles[0] : f.profiles;
                    const cover = f.config?.cover_image || f.config?.image_url || null;
                    return (
                      <Link key={f.id} href={`/preview/${f.id}`} className="flex gap-3 rounded-2xl border border-[#ecebe5] bg-white p-3 transition active:scale-[0.99]">
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#eef5d9]">
                          {cover ? (
                            <Image src={cover} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <span className="grid h-full w-full place-items-center text-[20px]">{meta.emoji}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[14px] font-semibold">{f.name}</p>
                          <p className="mt-0.5 truncate text-[12px] text-[#7d8387]">
                            By {owner?.display_name || owner?.username || "creator"}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            {posts.length > 0 && (
              <section>
                <h2 className="mb-3 text-[15px] font-semibold">Posts</h2>
                <div className="space-y-3">
                  {posts.map((p) => {
                    const owner = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                    return (
                      <article key={p.id} className="rounded-2xl border border-[#ecebe5] bg-white p-3.5">
                        <p className="text-[12px] font-semibold text-[#7d8387]">
                          {owner?.display_name || owner?.username || "creator"}
                        </p>
                        {p.title && <p className="mt-1 text-[14px] font-semibold">{p.title}</p>}
                        {p.content && (
                          <p className="mt-1 line-clamp-3 text-[13px] leading-[1.5] text-[#5c6360]">{p.content}</p>
                        )}
                        {p.media_url && p.media_type === "image" && (
                          <div className="relative mt-3 aspect-video overflow-hidden rounded-xl">
                            <Image src={p.media_url} alt="" fill className="object-cover" unoptimized />
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
    }

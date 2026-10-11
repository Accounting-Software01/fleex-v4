"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  AtSign,
  BriefcaseBusiness,
  Check,
  FolderKanban,
  Globe2,
  Group,
  Loader2,
  Search,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";

type SearchKind = "all" | "people" | "news" | "forges" | "projects" | "groups";

type PersonResult = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  follower_count?: number | null;
  forge_count?: number | null;
  is_verified?: boolean;
  is_official?: boolean;
};

type ContentResult = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  excerpt?: string | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
  slug?: string | null;
  username?: string | null;
  source?: string | null;
  created_at?: string | null;
  url?: string | null;
  user_id?: string | null;
  members_count?: number | null;
  display_name?: string | null;
  avatar_url?: string | null;
  creator_username?: string | null;
  template_type?: string | null;
  active_members?: Array<{
    id: string;
    display_name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
  }>;
};

type SearchResponse = {
  people?: PersonResult[];
  news?: ContentResult[];
  forges?: ContentResult[];
  projects?: ContentResult[];
  groups?: ContentResult[];
};

const SEARCH_TYPES: { key: SearchKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "people", label: "People" },
  { key: "news", label: "News" },
  { key: "forges", label: "Forges" },
  { key: "projects", label: "Projects" },
  { key: "groups", label: "Groups" },
];

const TRENDING_SEARCHES = [
  "AI creators",
  "Deepfakes",
  "Technology policy",
  "Design systems",
  "Climate projects",
  "Future of work",
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<SearchKind>("all");
  const [results, setResults] = useState<SearchResponse>({});
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [recommendedPeople, setRecommendedPeople] = useState<PersonResult[]>(
    [],
  );
  const [recommendedForges, setRecommendedForges] = useState<ContentResult[]>(
    [],
  );

  const loadRecommendedProfiles = async (excludeUserId?: string) => {
    let request = supabase
      .from("profiles")
      .select(
        "id, username, display_name, avatar_url, bio, follower_count, forge_count, is_verified, is_official",
      )
      .order("follower_count", { ascending: false, nullsFirst: false })
      .limit(8);

    if (excludeUserId) request = request.neq("id", excludeUserId);

    const { data, error } = await request;
    if (!error && data) {
      setRecommendedPeople(data as PersonResult[]);
      return;
    }

    // Fallback for projects whose profiles table has stricter RLS.
    try {
      const response = await fetch(
        "/api/search?type=people&recommended=true&limit=8",
      );
      if (!response.ok) return;
      const fallback = await response.json();
      setRecommendedPeople(
        (fallback.people || fallback.profiles || [])
          .filter((person: PersonResult) => person.id !== excludeUserId)
          .slice(0, 8),
      );
    } catch (fallbackError) {
      console.error("[Pull recommendations] error:", fallbackError);
    }
  };

  const loadRecommendedForges = async () => {
    const { data, error } = await supabase
      .from("forges")
      .select(
        "id, name, description, template_type, user_id, config, is_published, is_public_preview, updated_at, created_at",
      )
      .or("is_published.eq.true,is_public_preview.eq.true")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .limit(8);

    if (!error && data) {
      const ownerIds = [
        ...new Set(data.map((forge: any) => forge.user_id).filter(Boolean)),
      ];
      const { data: owners } = ownerIds.length
        ? await supabase
            .from("profiles")
            .select("id, username, display_name, avatar_url")
            .in("id", ownerIds)
        : { data: [] };
      const ownersById = new Map(
        (owners || []).map((owner: any) => [owner.id, owner]),
      );

      const forgeResults = await Promise.all(
        data.map(async (forge: any) => {
          const owner = ownersById.get(forge.user_id);
          const { data: contributorRows } = await supabase
            .from("forge_contributors")
            .select(
              "user_id, joined_at, profiles(id, username, display_name, avatar_url)",
            )
            .eq("forge_id", forge.id)
            .order("joined_at", { ascending: false })
            .limit(4);
          const ownerMember = owner
            ? [
                {
                  id: owner.id,
                  username: owner.username,
                  display_name: owner.display_name,
                  avatar_url: owner.avatar_url,
                },
              ]
            : [];
          const contributorMembers = (contributorRows || [])
            .map((row: any) => row.profiles)
            .filter(Boolean);
          const members = [...ownerMember, ...contributorMembers].filter(
            (member, index, list) =>
              list.findIndex((item) => item.id === member.id) === index,
          );
          return {
            id: forge.id,
            name: forge.name,
            title: forge.name,
            description: forge.description,
            source: forge.template_type,
            user_id: forge.user_id,
            display_name: owner?.display_name || null,
            creator_username: owner?.username || null,
            avatar_url: owner?.avatar_url || null,
            template_type: forge.template_type,
            image_url:
              forge.config?.cover_image ||
              forge.config?.image_url ||
              forge.config?.thumbnail_url ||
              forge.config?.heroImage ||
              (Array.isArray(forge.config?.images)
                ? forge.config.images[0]
                : null),
            members_count: members.length,
            active_members: members.slice(0, 3),
            created_at: forge.updated_at || forge.created_at,
          };
        }),
      );
      setRecommendedForges(forgeResults as ContentResult[]);
      return;
    }

    // Fallback for projects where public Forge reads are exposed through the search API.
    try {
      const response = await fetch(
        "/api/search?type=forges&recommended=true&limit=8",
      );
      if (!response.ok) return;
      const fallback = await response.json();
      setRecommendedForges((fallback.forges || []).slice(0, 8));
    } catch (fallbackError) {
      console.error("[Pull forge discovery] error:", fallbackError);
    }
  };

  useEffect(() => {
    const saved = window.localStorage.getItem("recent_searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 6));
      } catch {
        window.localStorage.removeItem("recent_searches");
      }
    }

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        await Promise.all([loadRecommendedProfiles(), loadRecommendedForges()]);
        return;
      }
      setCurrentUserId(user.id);
      const { data: allies } = await supabase
        .from("allies")
        .select("following_id")
        .eq("follower_id", user.id);
      setFollowing(new Set(allies?.map((ally) => ally.following_id) || []));
      await Promise.all([
        loadRecommendedProfiles(user.id),
        loadRecommendedForges(),
      ]);
    };

    loadUser().catch((error) =>
      console.error("[Pull search] user loading error:", error),
    );
  }, [supabase]);

  const performSearch = async (term: string, kind = activeType) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) {
      setResults({});
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(cleanTerm)}&type=${kind}`,
      );
      if (!response.ok)
        throw new Error(`Search failed with ${response.status}`);
      const data = await response.json();
      setResults({
        people: data.people || data.profiles || [],
        news: data.news || [],
        forges: data.forges || [],
        projects: data.projects || [],
        groups: data.groups || [],
      });
    } catch (error) {
      console.error("[Search] error:", error);
      setResults({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialQuery = searchParams.get("q") || "";
    const initialType = (searchParams.get("type") as SearchKind) || "all";
    setQuery(initialQuery);
    if (SEARCH_TYPES.some((item) => item.key === initialType))
      setActiveType(initialType);
    if (initialQuery) performSearch(initialQuery, initialType);
  }, [searchParams]);

  const rememberSearch = (term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    const updated = [
      cleanTerm,
      ...recentSearches.filter(
        (item) => item.toLowerCase() !== cleanTerm.toLowerCase(),
      ),
    ].slice(0, 6);
    setRecentSearches(updated);
    window.localStorage.setItem("recent_searches", JSON.stringify(updated));
  };

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const cleanTerm = query.trim();
    if (!cleanTerm) return;
    rememberSearch(cleanTerm);
    router.push(
      `/search?q=${encodeURIComponent(cleanTerm)}&type=${activeType}`,
    );
    performSearch(cleanTerm, activeType);
  };

  const selectType = (kind: SearchKind) => {
    setActiveType(kind);
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&type=${kind}`);
      performSearch(query, kind);
    }
  };

  const runSuggestedSearch = (term: string) => {
    setQuery(term);
    rememberSearch(term);
    router.push(`/search?q=${encodeURIComponent(term)}&type=${activeType}`);
    performSearch(term, activeType);
  };

  const handleFollow = async (userId: string) => {
    if (!currentUserId || followLoading) return;
    const wasFollowing = following.has(userId);
    setFollowLoading(userId);
    setFollowing((previous) => {
      const next = new Set(previous);
      wasFollowing ? next.delete(userId) : next.add(userId);
      return next;
    });

    try {
      const response = await fetch("/api/allies", {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: userId }),
      });
      if (!response.ok) throw new Error("Follow update failed");
    } catch (error) {
      console.error("[Search follow] error:", error);
      setFollowing((previous) => {
        const next = new Set(previous);
        wasFollowing ? next.add(userId) : next.delete(userId);
        return next;
      });
    } finally {
      setFollowLoading(null);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    window.localStorage.removeItem("recent_searches");
  };

  const totalResults = Object.values(results).reduce(
    (total, items) => total + (items?.length || 0),
    0,
  );
  const hasResults = totalResults > 0;

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white text-[#14181c]">
      <header className="sticky top-0 z-30 border-b border-[#e5e5e0] bg-white/95 px-4 py-4 backdrop-blur-md sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              aria-label="Back to dashboard"
              className="rounded-full p-2 text-[#14181c] transition hover:bg-[#efefea] active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold tracking-[-0.04em]">
                Search Pull
              </h1>
              <p className="text-xs text-[#7d8387]">
                Find people, ideas, news, and communities.
              </p>
            </div>
          </div>

          <form onSubmit={submitSearch} className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7d8387]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search keywords across Pull..."
              aria-label="Search keywords across Pull"
              autoFocus
              className="w-full rounded-2xl border border-[#d9d9d4] bg-[#fbfaf6] py-3.5 pl-12 pr-24 text-base outline-none transition focus:border-[#1f2326] focus:bg-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults({});
                }}
                aria-label="Clear search"
                className="absolute right-20 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#7d8387] hover:bg-[#efefea]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#1f2326] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {SEARCH_TYPES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => selectType(item.key)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition ${activeType === item.key ? "border-[#1f2326] bg-[#1f2326] text-white" : "border-[#d9d9d4] bg-white text-[#7d8387] hover:bg-[#efefea]"}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        {loading ? (
          <SearchSkeleton />
        ) : query.trim() && hasResults ? (
          <ResultsView
            results={results}
            following={following}
            currentUserId={currentUserId}
            followLoading={followLoading}
            onFollow={handleFollow}
          />
        ) : query.trim() ? (
          <EmptySearch query={query} onSuggestion={runSuggestedSearch} />
        ) : (
          <DiscoverState
            recentSearches={recentSearches}
            recommendedPeople={recommendedPeople}
            recommendedForges={recommendedForges}
            following={following}
            currentUserId={currentUserId}
            followLoading={followLoading}
            onFollow={handleFollow}
            onSearch={runSuggestedSearch}
            onClearRecent={clearRecent}
          />
        )}
      </main>
    </div>
  );
}

function ResultsView({
  results,
  following,
  currentUserId,
  followLoading,
  onFollow,
}: {
  results: SearchResponse;
  following: Set<string>;
  currentUserId: string | null;
  followLoading: string | null;
  onFollow: (id: string) => void;
}) {
  const sections = [
    {
      key: "people" as const,
      label: "People",
      icon: Users,
      items: results.people || [],
    },
    {
      key: "news" as const,
      label: "News",
      icon: Globe2,
      items: results.news || [],
    },
    {
      key: "forges" as const,
      label: "Forges",
      icon: BriefcaseBusiness,
      items: results.forges || [],
    },
    {
      key: "projects" as const,
      label: "Projects",
      icon: BriefcaseBusiness,
      items: results.projects || [],
    },
    {
      key: "groups" as const,
      label: "Groups",
      icon: Group,
      items: results.groups || [],
    },
  ];

  return (
    <div className="space-y-8">
      {sections.map((section) =>
        section.items.length ? (
          <section key={section.key}>
            <div className="mb-3 flex items-center gap-2">
              <section.icon className="h-4 w-4 text-[#8aae00]" />
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
                {section.label}
              </h2>
              <span className="text-xs text-[#7d8387]">
                {section.items.length}
              </span>
            </div>
            {section.key === "people" ? (
              <div className="space-y-3">
                {(section.items as PersonResult[]).map((person) => (
                  <PersonResultCard
                    key={person.id}
                    person={person}
                    isFollowing={following.has(person.id)}
                    isCurrentUser={currentUserId === person.id}
                    isLoading={followLoading === person.id}
                    onFollow={() => onFollow(person.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(section.items as ContentResult[]).map((item) => (
                  <ContentResultCard
                    key={item.id}
                    item={item}
                    kind={section.key}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null,
      )}
    </div>
  );
}

function PersonResultCard({
  person,
  isFollowing,
  isCurrentUser,
  isLoading,
  onFollow,
}: {
  person: PersonResult;
  isFollowing: boolean;
  isCurrentUser: boolean;
  isLoading: boolean;
  onFollow: () => void;
}) {
  const name = person.display_name || person.username || "Pull member";
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#deded9] bg-[#fbfaf6] p-4 transition hover:border-[#b7f23a]">
      <Link
        href={`/profile/${person.username || person.id}`}
        className="shrink-0"
      >
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#1f2326] text-lg font-semibold text-[#b7f23a]">
          {person.avatar_url ? (
            <Image
              src={person.avatar_url}
              alt={name}
              width={56}
              height={56}
              className="h-full w-full object-cover"
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/profile/${person.username || person.id}`}>
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-semibold hover:underline">{name}</h3>
            {person.is_verified && (
              <Check className="h-4 w-4 shrink-0 rounded-full bg-[#1f2326] p-0.5 text-[#b7f23a]" />
            )}
            {person.is_official && (
              <span className="rounded-full bg-[#b7f23a] px-1.5 py-0.5 text-[9px] font-bold uppercase">
                Official
              </span>
            )}
          </div>
          <p className="truncate text-sm text-[#7d8387]">
            @{person.username || "member"}
          </p>
        </Link>
        {person.bio && (
          <p className="mt-1 line-clamp-1 text-xs text-[#535a5e]">
            {person.bio}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-xs text-[#7d8387]">
          <span>{person.follower_count || 0} allies</span>
          <span>{person.forge_count || 0} forges</span>
        </div>
      </div>
      {isCurrentUser ? (
        <span className="shrink-0 rounded-full border border-[#d9d9d4] px-3 py-2 text-xs font-semibold text-[#7d8387]">
          You
        </span>
      ) : (
        <button
          type="button"
          onClick={onFollow}
          disabled={isLoading}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-semibold transition ${isFollowing ? "border border-[#d9d9d4] bg-white text-[#14181c]" : "bg-[#1f2326] text-white hover:bg-black"}`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-1">
              {isFollowing ? (
                <UserCheck className="h-3.5 w-3.5" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              {isFollowing ? "Allied" : "Ally"}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

function ContentResultCard({
  item,
  kind,
}: {
  item: ContentResult;
  kind: "news" | "forges" | "projects" | "groups";
}) {
  if (kind === "forges") {
    return <ForgePostCard item={item} />;
  }

  const title = item.title || item.name || "Untitled result";
  const description = item.excerpt || item.description;
  const href =
    kind === "news" && item.url
      ? item.url
      : kind === "forges"
        ? `/preview/${item.id}`
        : item.slug
          ? `/${kind}/${item.slug}`
          : `/${kind}/${item.id}`;
  const Icon =
    kind === "news"
      ? Globe2
      : kind === "forges"
        ? BriefcaseBusiness
        : kind === "projects"
          ? BriefcaseBusiness
          : Group;
  return (
    <Link
      href={href}
      target={kind === "news" && item.url ? "_blank" : undefined}
      rel={kind === "news" && item.url ? "noreferrer" : undefined}
      className="group flex min-w-0 gap-3 rounded-2xl border border-[#deded9] bg-[#fbfaf6] p-3 transition hover:-translate-y-0.5 hover:border-[#b7f23a] hover:shadow-[0_10px_22px_rgba(31,35,38,0.07)]"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#efefea]">
        {item.image_url || item.thumbnail_url ? (
          <Image
            src={item.image_url || item.thumbnail_url || ""}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#8aae00]">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8aae00]">
            {kind}
          </span>
          {item.source && (
            <span className="truncate text-xs text-[#a0a4a6]">
              {item.source}
            </span>
          )}
        </div>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:underline">
          {title}
        </h3>
        {description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#7d8387]">
            {description}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-[11px] text-[#a0a4a6]">
          {item.members_count !== undefined && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {item.members_count} members
            </span>
          )}
          {item.created_at && (
            <span>{new Date(item.created_at).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ForgePostCard({ item }: { item: ContentResult }) {
  const title = item.title || item.name || "Untitled Forge";
  const creatorName =
    item.display_name || item.creator_username || "Pull creator";
  const creatorHandle = item.creator_username
    ? `@${item.creator_username}`
    : "Creator";
  const templateLabel = (
    item.template_type ||
    item.source ||
    "Forge"
  ).toUpperCase();
  const activeMembers = item.active_members || [];
  const coverImage = item.image_url || item.thumbnail_url;

  return (
    <Link
      href={`/preview/${item.id}`}
      className="group flex min-w-0 gap-4 border border-[#deded9] bg-white p-3 transition hover:border-[#1f2326] hover:shadow-[0_10px_24px_rgba(31,35,38,0.08)] sm:gap-5 sm:p-4"
    >
      <div className="relative h-32 w-[37%] shrink-0 overflow-hidden bg-[#edf1eb] sm:h-36 sm:w-44">
        {coverImage ? (
          <Image
            src={coverImage}
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#eef5d9] text-[#5e7800]">
            <BriefcaseBusiness className="h-7 w-7" strokeWidth={1.5} />
            <span className="text-[9px] font-black uppercase tracking-[0.15em]">
              Forge
            </span>
          </div>
        )}
        <span className="absolute left-2 top-2 bg-[#b7f23a] px-2 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#14181c]">
          Forge
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-[#7d8387]">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1f2326] text-[10px] font-bold text-[#b7f23a]">
              {item.avatar_url ? (
                <Image
                  src={item.avatar_url}
                  alt={creatorName}
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                creatorName.charAt(0).toUpperCase()
              )}
            </div>
            <span className="truncate font-semibold text-[#14181c]">
              By {creatorName}
            </span>
            <span className="hidden truncate sm:inline">{creatorHandle}</span>
          </div>
          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#6f9000]">
            {templateLabel}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight tracking-[-0.05em] text-[#14181c] group-hover:underline sm:text-xl">
            {title}
          </h3>
          {item.description && (
            <p className="mt-1 line-clamp-1 text-xs text-[#697278] sm:text-sm">
              {item.description}
            </p>
          )}
        </div>

        <div className="mt-3 flex min-w-0 items-center gap-2 text-[11px] text-[#697278] sm:gap-3 sm:text-xs">
          <span className="shrink-0">{item.members_count || 0} members</span>
          <span className="text-[#c2c8c2]">·</span>
          <div className="flex shrink-0 -space-x-2">
            {activeMembers.length ? (
              activeMembers.map((member) => (
                <div
                  key={member.id}
                  className="h-6 w-6 overflow-hidden rounded-full border-2 border-white bg-[#1f2326] text-center text-[9px] font-bold leading-5 text-[#b7f23a]"
                  title={member.display_name || member.username || "Member"}
                >
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt=""
                      width={24}
                      height={24}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    (member.display_name || member.username || "M")
                      .charAt(0)
                      .toUpperCase()
                  )}
                </div>
              ))
            ) : (
              <span className="text-[#a0a4a6]">No activity yet</span>
            )}
          </div>
          {activeMembers.length > 0 && (
            <>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#11a94d]" />
              <span className="hidden whitespace-nowrap sm:inline">
                Active {formatForgeActivity(item.created_at)}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center self-center text-[#697278] transition group-hover:translate-x-0.5 group-hover:text-[#14181c]">
        <ArrowLeft className="h-5 w-5 rotate-180" />
      </div>
    </Link>
  );
}

function formatForgeActivity(value?: string | null) {
  if (!value) return "recently";
  const hours = Math.max(
    1,
    Math.round((Date.now() - new Date(value).getTime()) / 3_600_000),
  );
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function RecommendedProfiles({
  people,
  following,
  currentUserId,
  followLoading,
  onFollow,
}: {
  people: PersonResult[];
  following: Set<string>;
  currentUserId: string | null;
  followLoading: string | null;
  onFollow: (id: string) => void;
}) {
  if (!people.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
            Recommended profiles
          </h2>
          <p className="mt-1 text-sm text-[#7d8387]">
            People worth discovering on Pull.
          </p>
        </div>
        <Users className="h-5 w-5 text-[#8aae00]" />
      </div>
      <div className="space-y-3">
        {people.map((person) => (
          <PersonResultCard
            key={person.id}
            person={person}
            isFollowing={following.has(person.id)}
            isCurrentUser={currentUserId === person.id}
            isLoading={followLoading === person.id}
            onFollow={() => onFollow(person.id)}
          />
        ))}
      </div>
    </section>
  );
}

function RecommendedForges({ forges }: { forges: ContentResult[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
            Featured Forges
          </h2>
          <p className="mt-1 text-sm text-[#7d8387]">
            Explore public spaces built by Pull creators.
          </p>
        </div>
        <BriefcaseBusiness className="h-5 w-5 text-[#8aae00]" />
      </div>
      <div className="space-y-4">
        {forges.map((forge) => (
          <ContentResultCard key={forge.id} item={forge} kind="forges" />
        ))}
      </div>
    </section>
  );
}

function DiscoverState({
  recentSearches,
  recommendedPeople,
  recommendedForges,
  following,
  currentUserId,
  followLoading,
  onFollow,
  onSearch,
  onClearRecent,
}: {
  recentSearches: string[];
  recommendedPeople: PersonResult[];
  recommendedForges: ContentResult[];
  following: Set<string>;
  currentUserId: string | null;
  followLoading: string | null;
  onFollow: (id: string) => void;
  onSearch: (term: string) => void;
  onClearRecent: () => void;
}) {
  return (
    <div className="space-y-9">
      <RecommendedProfiles
        people={recommendedPeople}
        following={following}
        currentUserId={currentUserId}
        followLoading={followLoading}
        onFollow={onFollow}
      />
      {recommendedForges.length > 0 && (
        <RecommendedForges forges={recommendedForges} />
      )}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-[#8aae00]" />
          <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
            Trending keywords
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_SEARCHES.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => onSearch(term)}
              className="rounded-full border border-[#d9d9d4] bg-[#fbfaf6] px-4 py-2.5 text-sm font-semibold transition hover:border-[#b7f23a] hover:bg-[#efffc8]"
            >
              {term}
            </button>
          ))}
        </div>
      </section>
      {recentSearches.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AtSign className="h-4 w-4 text-[#7d8387]" />
              <h2 className="text-sm font-bold uppercase tracking-[0.12em]">
                Recent searches
              </h2>
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              className="text-xs font-semibold text-[#7d8387] hover:text-red-600"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2">
            {recentSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSearch(term)}
                className="flex w-full items-center gap-3 rounded-xl border border-[#deded9] bg-[#fbfaf6] p-3 text-left text-sm transition hover:border-[#b7f23a]"
              >
                <Search className="h-4 w-4 text-[#7d8387]" />
                {term}
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="rounded-2xl border border-[#deded9] bg-[#fbfaf6] px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f2326] text-[#b7f23a]">
          <Search className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold tracking-[-0.03em]">
          Search the whole Pull world
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#7d8387]">
          Use keywords to discover creators, news, forges, projects, and groups
          in one place.
        </p>
      </div>
    </div>
  );
}

function EmptySearch({
  query,
  onSuggestion,
}: {
  query: string;
  onSuggestion: (term: string) => void;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#efefea] text-[#7d8387]">
        <Search className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-semibold tracking-[-0.03em]">
        No matches for “{query}”
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#7d8387]">
        Try a broader keyword, a creator name, or a topic such as “AI”,
        “design”, or “climate”.
      </p>
      <button
        type="button"
        onClick={() => onSuggestion("AI creators")}
        className="mt-6 rounded-full bg-[#1f2326] px-5 py-3 text-sm font-semibold text-white"
      >
        Try a trending search
      </button>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((section) => (
        <section key={section}>
          <div className="mb-3 h-4 w-24 animate-pulse rounded-full bg-[#e5e5e0]" />
          <div className="grid gap-3 sm:grid-cols-2">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="flex gap-3 rounded-2xl border border-[#efefea] p-3"
              >
                <div className="h-16 w-16 animate-pulse rounded-xl bg-[#e5e5e0]" />
                <div className="flex-1">
                  <div className="h-4 w-2/3 animate-pulse rounded-full bg-[#e5e5e0]" />
                  <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-[#efefea]" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-[#efefea]" />
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d9d9d4] border-t-[#1f2326]" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}

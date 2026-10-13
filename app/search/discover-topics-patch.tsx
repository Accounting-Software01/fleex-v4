/* =========================================================================
   DROP-IN PATCH for the Discover page
   1. Add `interests` to PersonResult
   2. Add useTopicCreators() and call it in DiscoverContent
   3. Replace TopicTile, TopicsView's grid section, FollowSuggestionCard
   Your TOPICS array stays exactly as it is.
   ========================================================================= */

// 1) Types ------------------------------------------------------------------
type TopicCreator = {
  id: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
};

type TopicCreatorMap = Record<string, TopicCreator[]>; // topic.key -> real people

// 2) Hook: real people per topic ---------------------------------------------
// Expects profiles.interests (text[]) containing topic keys, e.g. {"tech","ai"}.
// If the column doesn't exist or nobody matches, tiles simply show no avatars
// (no fake associations).
function useTopicCreators(supabase: ReturnType<typeof createClient>) {
  const [map, setMap] = useState<TopicCreatorMap>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, interests")
        .not("avatar_url", "is", null)
        .order("follower_count", { ascending: false, nullsFirst: false })
        .limit(300);

      if (error || !data || cancelled) return;

      const next: TopicCreatorMap = {};
      for (const p of data as (TopicCreator & { interests?: string[] | null })[]) {
        for (const key of p.interests ?? []) {
          const list = (next[key] ||= []);
          if (list.length < 8) list.push(p); // keep top 8 per topic
        }
      }
      setMap(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  return map;
}

// In DiscoverContent:
//   const topicCreators = useTopicCreators(supabase);
// and pass it down:
//   <TopicsView ... topicCreators={topicCreators} />

// 3) TopicsView (replace the grid section + add prop) -------------------------
// Add `topicCreators: TopicCreatorMap` to the props type, then:
//
//   <section>
//     <h2 className="mb-1 text-[15px] font-semibold tracking-[-0.01em]">Explore topics</h2>
//     <p className="mb-3 text-[12.5px] text-[#7d8387]">Tap a topic to see posts and the people behind them</p>
//     <div className="grid grid-cols-2 gap-3">
//       {TOPICS.map((topic) => (
//         <TopicTile key={topic.key} topic={topic} creators={topicCreators[topic.key] ?? []} />
//       ))}
//     </div>
//   </section>

// 4) Avatar stack ------------------------------------------------------------
function AvatarStack({ people, max = 3 }: { people: TopicCreator[]; max?: number }) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  if (shown.length === 0) return null;

  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((p) => {
          const name = p.display_name || p.username || "?";
          return (
            <div
              key={p.id}
              className="h-7 w-7 overflow-hidden rounded-full bg-[#14181c] ring-2 ring-white/90"
            >
              {p.avatar_url ? (
                <Image
                  src={p.avatar_url}
                  alt={name}
                  width={28}
                  height={28}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-[11px] font-semibold text-[#b7f23a]">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {extra > 0 && (
        <span className="ml-2 text-[11.5px] font-semibold text-white/90 drop-shadow">
          +{extra}
        </span>
      )}
    </div>
  );
}

// 5) Topic tile: real people + clear touch target -----------------------------
function TopicTile({ topic, creators }: { topic: Topic; creators: TopicCreator[] }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(topic.label)}&type=all`}
      className="group relative block aspect-[4/5] select-none overflow-hidden rounded-3xl shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-150 active:scale-[0.97]"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      {topic.image ? (
        <Image src={topic.image} alt="" fill className="object-cover" unoptimized />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${topic.gradient}`}>
          {/* oversized emoji as a soft watermark, not the focal point */}
          <span
            aria-hidden
            className="absolute -right-3 -top-2 text-[88px] leading-none opacity-20"
          >
            {topic.emoji}
          </span>
        </div>
      )}

      {/* legibility scrim */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />

      {/* emoji chip (top-left) */}
      <div className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-[18px] backdrop-blur-md">
        {topic.emoji}
      </div>

      {/* bottom: label + people */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-3.5">
        <h3 className="text-[17px] font-bold leading-tight tracking-[-0.01em] text-white drop-shadow">
          {topic.label}
        </h3>
        {creators.length > 0 ? (
          <AvatarStack people={creators} />
        ) : (
          <span className="text-[11.5px] font-medium text-white/70">Explore</span>
        )}
      </div>
    </Link>
  );
}

// 6) Follow suggestion card: bigger avatar, bio line, 44px-ish button ----------
function FollowSuggestionCard({
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
    <div className="flex w-[164px] shrink-0 snap-start flex-col items-center rounded-3xl border border-[#ecebe5] bg-white p-4 text-center">
      <Link
        href={`/profile/${person.username || person.id}`}
        className="flex w-full flex-col items-center active:opacity-70"
      >
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[#14181c] text-[20px] font-semibold text-[#b7f23a]">
          {person.avatar_url ? (
            <Image
              src={person.avatar_url}
              alt=""
              width={64}
              height={64}
              className="h-full w-full object-cover"
            />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="mt-2.5 flex max-w-full items-center gap-1">
          <h3 className="truncate text-[14px] font-semibold text-[#14181c]">{name}</h3>
          {person.is_verified && (
            <Check
              className="h-3.5 w-3.5 shrink-0 rounded-full bg-[#14181c] p-0.5 text-[#b7f23a]"
              strokeWidth={3}
            />
          )}
        </div>
        <p className="max-w-full truncate text-[12px] text-[#7d8387]">
          @{person.username || "member"}
        </p>
        {person.bio && (
          <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[12px] leading-4 text-[#5b6165]">
            {person.bio}
          </p>
        )}
      </Link>

      {isCurrentUser ? (
        <span className="mt-3 grid h-10 w-full place-items-center rounded-full border border-[#e3e2dd] text-[12.5px] font-semibold text-[#8b8f8a]">
          You
        </span>
      ) : (
        <button
          type="button"
          onClick={onFollow}
          disabled={isLoading}
          className={`mt-3 grid h-10 w-full place-items-center rounded-full text-[13px] font-semibold transition active:scale-95 disabled:opacity-50 ${
            isFollowing
              ? "border border-[#e3e2dd] bg-white text-[#14181c]"
              : "bg-[#14181c] text-white"
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span className="inline-flex items-center gap-1.5">
              {isFollowing ? (
                <UserCheck className="h-3.5 w-3.5" strokeWidth={2.6} />
              ) : (
                <UserPlus className="h-3.5 w-3.5" strokeWidth={2.6} />
              )}
              {isFollowing ? "Allied" : "Follow"}
            </span>
          )}
        </button>
      )}
    </div>
  );
}

// 7) Suggestions row: add snap scrolling so swipes land cleanly ----------------
// className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]"

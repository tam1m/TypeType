import { createFileRoute } from "@tanstack/react-router";
import { EmbedPlayerShell } from "../components/embed-player-shell";
import { useAuth } from "../hooks/use-auth";
import { useSettings } from "../hooks/use-settings";
import { MEMBER_ONLY_MESSAGE, useStream } from "../hooks/use-stream";
import { ApiError } from "../lib/api";
import { toWatchSourceUrl } from "../lib/watch-url";

type EmbedSearch = {
  t?: string | number;
  autoplay?: number;
};

function parseStartTime(raw?: string | number): number {
  if (raw == null) return 0;
  if (typeof raw === "number") return Math.max(0, raw);
  const trimmed = raw.trim();
  if (!trimmed) return 0;
  const num = Number(trimmed);
  if (Number.isFinite(num)) return Math.max(0, num);
  const match = trimmed.match(
    /^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s?)?$/,
  );
  if (!match) return 0;
  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
}

function EmbedLoading() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="aspect-video w-full max-w-[133.333vh]">
        <div className="w-full h-full bg-black rounded-lg" />
      </div>
    </div>
  );
}

function EmbedError({ message }: { message: string }) {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-6 text-center">
        <p className="text-sm text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

function EmbedSignIn() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center px-4">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-6 text-center">
        <h1 className="text-base font-semibold text-white">Sign in to view</h1>
        <p className="text-sm text-zinc-400">
          This instance requires authentication to play embedded videos.
        </p>
        <a
          href="/login"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex h-9 items-center rounded-lg bg-white px-4 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}

function EmbedPage() {
  const { videoId } = Route.useParams();
  const { t, autoplay } = Route.useSearch();
  const sourceUrl = toWatchSourceUrl(videoId);
  const { authReady, isAuthed } = useAuth();
  const { settings, settingsReady } = useSettings();
  const useAuthenticatedStream = isAuthed && settings.accessMode === "allow_list";
  const streamEnabled = authReady && (!isAuthed || settingsReady);
  const {
    data: stream,
    isLoading,
    isError,
    error,
  } = useStream(sourceUrl, useAuthenticatedStream, streamEnabled);
  const startTime = parseStartTime(t) * 1000;
  const shouldAutoplay = autoplay === 1;

  if (isLoading && !stream) return <EmbedLoading />;
  if (!authReady) return <EmbedLoading />;

  if (isError || !stream) {
    const isAuthError =
      error instanceof ApiError && (error.status === 401 || error.status === 403);
    if (isAuthError && !isAuthed) {
      return <EmbedSignIn />;
    }
    const message =
      error instanceof ApiError && (error.status === 400 || error.status === 422)
        ? error.message
        : "Failed to load video.";
    return (
      <EmbedError
        message={message}
      />
    );
  }

  if (stream.requiresMembership) {
    return <EmbedError message={MEMBER_ONLY_MESSAGE} />;
  }

  return (
    <EmbedPlayerShell
      stream={stream}
      videoId={videoId}
      startTime={startTime}
      autoplay={shouldAutoplay}
    />
  );
}

export const Route = createFileRoute("/embed_/$videoId")({
  validateSearch: (search: Record<string, unknown>): EmbedSearch => ({
    t: typeof search.t === "string" || typeof search.t === "number" ? search.t : undefined,
    autoplay: typeof search.autoplay === "number" ? search.autoplay : undefined,
  }),
  component: EmbedPage,
});

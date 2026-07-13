import { Suspense } from "react";
import { usePlayerError } from "../hooks/use-player-error";
import { useSettings } from "../hooks/use-settings";
import type { VideoStream } from "../types/stream";
import { EmbedPlayer } from "./embed-player";

type Props = {
  stream: VideoStream;
  videoId: string;
  startTime: number;
  autoplay: boolean;
};

function EmbedLoading() {
  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <div className="aspect-video w-full max-w-[133.333vh]">
        <div className="w-full h-full bg-black rounded-lg" />
      </div>
    </div>
  );
}

export function EmbedPlayerShell({ stream, videoId, startTime, autoplay }: Props) {
  const { settings, settingsReady, update } = useSettings();
  const isLive = stream.isLive ?? false;
  const { manifestSrc, handleError, retryKey } = usePlayerError(
    stream,
    isLive,
    settings.enableHighQualityPlayback,
  );

  const watchUrl = `/watch?v=${encodeURIComponent(videoId)}`;

  return (
    <Suspense fallback={<EmbedLoading />}>
      <EmbedPlayer
        key={retryKey}
        src={manifestSrc}
        title={stream.title}
        poster={stream.thumbnail}
        subtitles={stream.subtitles}
        startTime={startTime}
        autoplay={autoplay}
        settingsReady={settingsReady}
        streamType={stream.isLive ? "live" : "on-demand"}
        sponsorBlockSegments={stream.sponsorBlockSegments}
        captionStyles={settings.captionStyles}
        onCaptionStylesChange={(captionStyles) => update.mutate({ captionStyles })}
        onError={handleError}
        watchUrl={watchUrl}
      />
    </Suspense>
  );
}

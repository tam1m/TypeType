import { usePlayerError } from "../hooks/use-player-error";
import { useSettings } from "../hooks/use-settings";
import { useWatchVttAssets } from "../hooks/use-watch-layout-assets";
import type { VideoStream } from "../types/stream";
import { EmbedPlayer } from "./embed-player";

type Props = {
  stream: VideoStream;
  videoId: string;
  startTime: number;
  autoplay: boolean;
};

export function EmbedPlayerShell({ stream, videoId, startTime, autoplay }: Props) {
  const { settings, settingsReady, update } = useSettings();
  const isLive = stream.isLive ?? false;
  const { manifestSrc, handleError, retryKey } = usePlayerError(
    stream,
    isLive,
    settings.enableHighQualityPlayback,
  );

  const watchUrl = `/watch?v=${encodeURIComponent(videoId)}`;

  const { thumbnailVtt, chaptersVtt } = useWatchVttAssets(
    stream,
    stream.sponsorBlockSegments,
    settings.sponsorBlockShowChapters,
  );

  return (
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
        chaptersVtt={chaptersVtt}
        thumbnailVtt={thumbnailVtt}
        sponsorBlockSegments={stream.sponsorBlockSegments}
        captionStyles={settings.captionStyles}
        onCaptionStylesChange={(captionStyles) => update.mutate({ captionStyles })}
        onError={handleError}
        watchUrl={watchUrl}
    />
  );
}

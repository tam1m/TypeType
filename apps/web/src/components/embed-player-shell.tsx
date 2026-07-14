import { usePlayerError } from "../hooks/use-player-error";
import { useSettings } from "../hooks/use-settings";
import { useWatchSponsorBlock } from "../hooks/use-watch-sponsorblock";
import { useWatchVttAssets } from "../hooks/use-watch-layout-assets";
import { getOriginalAudioLocale, getOriginalAudioTrackId, getPreferredDefaultAudioTrackId } from "../lib/audio-track";
import type { VideoStream } from "../types/stream";
import { EmbedPlayer } from "./embed-player";

type Props = {
  stream: VideoStream;
  videoId: string;
  startTime: number;
  autoplay: boolean;
  isAuthed: boolean;
};

export function EmbedPlayerShell({ stream, videoId, startTime, autoplay, isAuthed }: Props) {
  const { settings, settingsReady, update } = useSettings();
  const isLive = stream.isLive ?? false;
  const { manifestSrc, handleError, retryKey, qualityFailed } = usePlayerError(
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

  const sponsor = useWatchSponsorBlock(stream, settings);
  const autoSkipSponsorBlock = isAuthed && settings.sponsorBlockMode !== "disabled";

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
        defaultAudioLanguage={settings.defaultAudioLanguage || undefined}
        preferOriginalLanguage={settings.preferOriginalLanguage}
        defaultQuality={qualityFailed ? undefined : settings.defaultQuality}
        originalAudioTrackId={getOriginalAudioTrackId(stream)}
        preferredDefaultAudioTrackId={getPreferredDefaultAudioTrackId(stream)}
        originalAudioLocale={getOriginalAudioLocale(stream)}
        defaultSubtitleLanguage={settings.defaultSubtitleLanguage || undefined}
        subtitlesEnabled={settings.subtitlesEnabled}
        sponsorBlockSegments={sponsor.segments}
        autoSkipSponsorBlockSegments={isAuthed ? sponsor.autoSkipSegments : []}
        manualSkipSponsorBlockSegments={isAuthed ? sponsor.manualSkipSegments : sponsor.segments}
        autoSkipSponsorBlock={autoSkipSponsorBlock}
        muteSponsorBlockInsteadOfSkip={settings.sponsorBlockMuteInsteadOfSkip}
        showCurrentSponsorBlockSegment={settings.sponsorBlockShowCurrentSegment}
        captionStyles={settings.captionStyles}
        onCaptionStylesChange={(captionStyles) => update.mutate({ captionStyles })}
        onError={handleError}
        watchUrl={watchUrl}
    />
  );
}

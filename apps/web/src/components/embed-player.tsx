import { useEffect, useState } from "react";
import { isIosDevice } from "../lib/ios-device";
import type { MediaSrc } from "../lib/vidstack";
import { patchVidstackProviderLoaders } from "../lib/vidstack-provider-loader-patch";
import {
  DefaultVideoLayout,
  defaultLayoutIcons,
  MediaPlayer,
  MediaProvider,
  Track,
} from "../lib/vidstack";
import type { SponsorBlockSegmentItem, SubtitleItem } from "../types/api";
import { AudioTrackSelector } from "./audio-track-selector";
import { FormatSelector } from "./format-selector";
import { MediaProgressEvents } from "./media-progress-events";
import { MediaSessionSync } from "./media-session-sync";
import { PlayerDefaults } from "./player-defaults";
import { PlayerHotkeys } from "./player-hotkeys";
import { PlayerSeeker, SponsorBlockSkipper } from "./player-internals";
import { PlayerPlayPauseIndicator } from "./player-play-pause-indicator";
import { QualitySelector } from "./quality-selector";
import { SponsorBlockBar } from "./sponsorblock-bar";
import { SponsorBlockCurrentSegment } from "./sponsorblock-current-segment";
import { buildSafeSubtitleTracks } from "./subtitle-track-utils";
import { Toast } from "./toast";
import { ChaptersTrack, onProviderChange } from "./video-player-core";
import { VolumeRestorer } from "./volume-restorer";

patchVidstackProviderLoaders();

type Props = {
  src: MediaSrc;
  title?: string;
  poster?: string;
  subtitles?: SubtitleItem[];
  startTime?: number;
  autoplay?: boolean;
  streamType?: "on-demand" | "live";
  chaptersVtt?: string;
  sponsorBlockSegments?: SponsorBlockSegmentItem[];
  autoSkipSponsorBlock?: boolean;
  watchUrl?: string;
  initialVolume?: number;
  initialMuted?: boolean;
  settingsReady?: boolean;
  defaultAudioLanguage?: string;
  preferOriginalLanguage?: boolean;
  originalAudioTrackId?: string | null;
  preferredDefaultAudioTrackId?: string | null;
  originalAudioLocale?: string | null;
  defaultSubtitleLanguage?: string;
  subtitlesEnabled?: boolean;
  onVolumeChange?: (volume: number, muted: boolean) => void;
  onTimeUpdate?: (positionMs: number) => void;
  onPause?: () => void;
  onSeeked?: () => void;
  onError?: () => void;
  onEnded?: () => void;
};

export function EmbedPlayer({
  src,
  title,
  poster,
  subtitles,
  startTime = 0,
  autoplay = false,
  streamType = "on-demand",
  chaptersVtt,
  sponsorBlockSegments,
  autoSkipSponsorBlock = true,
  watchUrl,
  initialVolume = 1,
  initialMuted = false,
  settingsReady = false,
  defaultAudioLanguage,
  preferOriginalLanguage,
  originalAudioTrackId,
  preferredDefaultAudioTrackId,
  originalAudioLocale,
  defaultSubtitleLanguage,
  subtitlesEnabled,
  onVolumeChange,
  onTimeUpdate,
  onPause,
  onSeeked,
  onError,
  onEnded,
}: Props) {
  const ios = isIosDevice();
  const srcKey = typeof src === "string" ? src : String(src.src);
  const subtitleTracks = buildSafeSubtitleTracks(subtitles);
  const shouldPreferOriginalLanguage = preferOriginalLanguage ?? true;
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <div className="relative w-full h-full bg-black group">
      {title && watchUrl && (
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-0 left-0 right-0 z-10 flex items-center gap-2 px-3 py-2 text-sm text-white/90 transition-opacity opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)",
          }}
        >
          <span className="truncate">{title}</span>
        </a>
      )}
      <MediaPlayer
        key={srcKey}
        src={src}
        title={title}
        poster={poster}
        viewType="video"
        streamType={streamType}
        logLevel="warn"
        crossOrigin
        playsInline
        hideControlsOnMouseLeave
        {...(ios ? { "webkit-playsinline": "true" } : {})}
        autoPlay={autoplay}
        storage={null}
        onProviderChange={onProviderChange}
        onError={() => onError?.()}
        onEnded={() => onEnded?.()}
        className="w-full h-full dark"
      >
        <MediaProvider>
          {subtitleTracks.map((s) => (
            <Track
              key={s.key}
              kind="subtitles"
              src={s.src}
              label={s.label}
              lang={s.lang}
              type="vtt"
            />
          ))}
          {chaptersVtt && <ChaptersTrack src={chaptersVtt} />}
        </MediaProvider>
        <MediaProgressEvents
          onTimeUpdate={onTimeUpdate}
          onPause={onPause}
          onSeeked={onSeeked}
          onEnded={onEnded}
        />
        <DefaultVideoLayout
          icons={defaultLayoutIcons}
          translations={{ Captions: "Subtitles" }}
          smallLayoutWhen={false}
          menuContainer="body"
          menuGroup="bottom"
          slots={{
            settingsMenuItemsStart: (
              <>
                <AudioTrackSelector originalLocale={originalAudioLocale} />
                <QualitySelector />
                <FormatSelector />
              </>
            ),
          }}
        />
        <PlayerSeeker startTime={startTime} />
        <PlayerDefaults
          defaultAudioLanguage={defaultAudioLanguage || undefined}
          preferOriginalLanguage={shouldPreferOriginalLanguage}
          requireOriginalLanguage
          onOriginalLanguageUnavailable={() => {
            setToast("Original audio unavailable");
          }}
          originalAudioTrackId={originalAudioTrackId}
          preferredDefaultAudioTrackId={preferredDefaultAudioTrackId}
          originalAudioLocale={originalAudioLocale}
          defaultSubtitleLanguage={defaultSubtitleLanguage}
          subtitlesEnabled={subtitlesEnabled}
        />
        <VolumeRestorer
          initialVolume={initialVolume}
          initialMuted={initialMuted}
          settingsReady={settingsReady}
          autoplay={autoplay}
          onVolumeChange={onVolumeChange}
        />
        <MediaSessionSync
          title={title}
          artwork={poster}
          canSeek={streamType !== "live"}
          isLive={streamType === "live"}
        />
        <PlayerHotkeys canSeek={streamType !== "live"} />
        <PlayerPlayPauseIndicator />
        {autoSkipSponsorBlock && sponsorBlockSegments && (
          <SponsorBlockSkipper
            segments={sponsorBlockSegments}
            muteInsteadOfSkip={false}
          />
        )}
        {sponsorBlockSegments && <SponsorBlockBar segments={sponsorBlockSegments} />}
        {sponsorBlockSegments && (
          <SponsorBlockCurrentSegment
            segments={sponsorBlockSegments}
            autoSkipSegments={sponsorBlockSegments}
            manualSkipSegments={[]}
            muteInsteadOfSkip={false}
          />
        )}
      </MediaPlayer>
      <Toast message={toast} />
    </div>
  );
}

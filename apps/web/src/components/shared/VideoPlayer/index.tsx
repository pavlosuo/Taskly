"use client";
import { type ComponentProps, forwardRef, type ReactNode } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  CaptionsOffIcon,
  CaptionsOnIcon,
  CheckIcon,
  ChevronIcon,
  FullscreenEnterIcon,
  FullscreenExitIcon,
  GearIcon,
  PauseIcon,
  PipEnterIcon,
  PipExitIcon,
  PlayIcon,
  RestartIcon,
  SpeedIcon,
  SpinnerIcon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeOffIcon,
} from "@videojs/react/icons";
import {
  Poster,
  Container,
  usePlayer,
  BufferingIndicator,
  CaptionsButton,
  Controls,
  ErrorDialog,
  FullscreenButton,
  Gesture,
  Hotkey,
  Menu,
  MuteButton,
  PiPButton,
  PlayButton,
  usePlaybackRateOptions,
  PlaybackRateRadioGroup,
  Popover,
  SeekIndicator,
  Slider,
  StatusAnnouncer,
  StatusIndicator,
  Time,
  TimeSlider,
  Tooltip,
  VolumeIndicator,
  VolumeSlider,
} from "@videojs/react";
import { Video } from "@videojs/react/video";
import { createPlayer } from "@videojs/react";
import { videoFeatures } from "@videojs/react/video";

export const { Player } = createPlayer({ features: videoFeatures });

const TOP_STATUS_ACTIONS = [
  "toggleSubtitles",
  "toggleFullscreen",
  "togglePictureInPicture",
] as const;

const CENTER_STATUS_ACTIONS = ["togglePaused"] as const;

const SEEK_TIME = 10;

export interface VideoPlayerProps {
  src: string;
  poster?: string | undefined;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ComponentProps<"button">>(
  function Button({ className, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        className={`media-button media-button--subtle media-button--icon ${className ?? ""}`}
        {...props}
      />
    );
  },
);

function MenuChevron({ flipped = false }: { flipped?: boolean }): ReactNode {
  return (
    <ChevronIcon
      className={`media-icon media-menu__chevron${flipped ? " media-icon--flipped" : ""}`}
    />
  );
}

function VolumePopover(): ReactNode {
  const volumeUnavailable = usePlayer(
    (s) => s.volumeAvailability !== "available",
  );
  const muteButton = (
    <MuteButton className="media-button--mute" render={<Button />}>
      <VolumeOffIcon className="media-icon media-icon--volume-off" />
      <VolumeLowIcon className="media-icon media-icon--volume-low" />
      <VolumeHighIcon className="media-icon media-icon--volume-high" />
    </MuteButton>
  );
  if (volumeUnavailable) return muteButton;
  return (
    <Popover.Root openOnHover delay={200} closeDelay={100} side="top">
      <Popover.Trigger render={muteButton} />
      <Popover.Popup className="media-surface media-popover media-popover--volume">
        <VolumeSlider.Root
          className="media-slider"
          orientation="vertical"
          thumbAlignment="edge"
        >
          <VolumeSlider.Track className="media-slider__track">
            <VolumeSlider.Fill className="media-slider__fill" />
          </VolumeSlider.Track>
          <VolumeSlider.Thumb className="media-slider__thumb media-slider__thumb--persistent" />
        </VolumeSlider.Root>
      </Popover.Popup>
    </Popover.Root>
  );
}

function SettingsMenu(): ReactNode {
  const { t } = useTranslation("common");
  const playbackRate = usePlaybackRateOptions();
  const hasPlaybackRate = playbackRate?.state.availability === "available";
  if (!hasPlaybackRate) return null;
  return (
    <Menu.Root side="top" align="center">
      <Tooltip.Root side="top">
        <Tooltip.Trigger
          render={
            <Menu.Trigger
              aria-label={t("videoPlayer.settings")}
              className="media-button--settings"
              render={<Button />}
            >
              <GearIcon className="media-icon media-icon--settings" />
            </Menu.Trigger>
          }
        />
        <Tooltip.Popup className="media-surface media-tooltip">
          <Tooltip.Label>{t("videoPlayer.settings")}</Tooltip.Label>
        </Tooltip.Popup>
      </Tooltip.Root>
      <Menu.Content className="media-surface media-popover media-menu media-menu--settings">
        <div className="media-menu__group">
          {hasPlaybackRate ? (
            <Menu.Root>
              <Menu.Trigger
                className="media-menu__item media-menu__item--submenu"
                render={(props) => (
                  <div {...props}>
                    <SpeedIcon className="media-icon" />
                    <span>{t("videoPlayer.speed")}</span>
                    <span className="media-menu__hint">
                      <bdi dir="auto" className="media-menu__hint-label">
                        {playbackRate.selectedLabel}
                      </bdi>
                      <MenuChevron />
                    </span>
                  </div>
                )}
              />
              <Menu.Content className="media-menu__panel">
                <Menu.Item className="media-menu__back">
                  <MenuChevron flipped />
                  {t("videoPlayer.speed")}
                </Menu.Item>
                <Menu.Separator className="media-menu__separator" />
                <PlaybackRateRadioGroup
                  className="media-menu__group"
                  aria-label={t("videoPlayer.speed")}
                  renderItem={(props, item) => (
                    <Menu.RadioItem {...props} className="media-menu__item">
                      <bdi dir="auto">{item.label}</bdi>
                      <Menu.ItemIndicator
                        checked={item.checked}
                        forceMount
                        className="media-menu__indicator"
                      >
                        <CheckIcon className="media-icon" />
                      </Menu.ItemIndicator>
                    </Menu.RadioItem>
                  )}
                />
              </Menu.Content>
            </Menu.Root>
          ) : null}
        </div>
      </Menu.Content>
    </Menu.Root>
  );
}

function PiPControl() {
  return (
    <Tooltip.Root side="top">
      <Tooltip.Trigger
        render={
          <PiPButton className="media-button--pip" render={<Button />}>
            <PipEnterIcon className="media-icon media-icon--pip-enter" />
            <PipExitIcon className="media-icon media-icon--pip-exit" />
          </PiPButton>
        }
      />
      <Tooltip.Popup className="media-surface media-tooltip">
        <Tooltip.Label />
        <Tooltip.Shortcut className="media-tooltip__kbd" />
      </Tooltip.Popup>
    </Tooltip.Root>
  );
}

function FullscreenControl() {
  return (
    <Tooltip.Root side="top">
      <Tooltip.Trigger
        render={
          <FullscreenButton
            className="media-button--fullscreen"
            render={<Button />}
          >
            <FullscreenEnterIcon className="media-icon media-icon--fullscreen-enter" />
            <FullscreenExitIcon className="media-icon media-icon--fullscreen-exit" />
          </FullscreenButton>
        }
      />
      <Tooltip.Popup className="media-surface media-tooltip">
        <Tooltip.Label />
        <Tooltip.Shortcut className="media-tooltip__kbd" />
      </Tooltip.Popup>
    </Tooltip.Root>
  );
}

export function VideoPlayer({
  src,
  poster,
  className,
  ...rest
}: VideoPlayerProps): ReactNode {
  return (
    <Player poster={poster}>
      <Container
        className={`media-default-skin media-default-skin--video${className ? " " + className : ""}`}
        {...rest}
      >
        <Video src={src} playsInline />
        {poster && <Poster />}
        <BufferingIndicator
          render={(props) => (
            <div {...props} className="media-buffering-indicator">
              <SpinnerIcon className="media-icon" />
            </div>
          )}
        />
        <ErrorDialog.Root>
          <ErrorDialog.Popup className="media-error">
            <div className="media-error__dialog media-surface">
              <div className="media-error__content">
                <ErrorDialog.Title className="media-error__title"></ErrorDialog.Title>
                <ErrorDialog.Description className="media-error__description" />
              </div>
              <div className="media-error__actions">
                <ErrorDialog.Close className="media-button media-button--primary"></ErrorDialog.Close>
              </div>
            </div>
          </ErrorDialog.Popup>
        </ErrorDialog.Root>
        <Controls.Root className="media-surface media-controls media-controls--root">
          <Tooltip.Provider>
            <div className="media-surface media-controls media-controls--primary">
              <div className="media-button-group">
                <Tooltip.Root side="top">
                  <Tooltip.Trigger
                    render={
                      <PlayButton
                        className="media-button--play"
                        render={<Button />}
                      >
                        <RestartIcon className="media-icon media-icon--restart" />
                        <PlayIcon className="media-icon media-icon--play" />
                        <PauseIcon className="media-icon media-icon--pause" />
                      </PlayButton>
                    }
                  />
                  <Tooltip.Popup className="media-surface media-tooltip">
                    <Tooltip.Label />
                    <Tooltip.Shortcut className="media-tooltip__kbd" />
                  </Tooltip.Popup>
                </Tooltip.Root>
                <VolumePopover />
              </div>
              <div className="media-time-controls">
                <Time.Value type="current" className="media-time" />
                <TimeSlider.Root className="media-slider">
                  <TimeSlider.Chapters
                    className="media-slider__chapters"
                    renderChapter={(props) => (
                      <div
                        {...props}
                        className={`${props.className} media-slider__chapter`}
                      >
                        <TimeSlider.Track className="media-slider__track media-slider__chapter-track">
                          <TimeSlider.Buffer className="media-slider__buffer" />
                          <TimeSlider.Fill className="media-slider__fill" />
                        </TimeSlider.Track>
                      </div>
                    )}
                  />
                  <TimeSlider.Thumb className="media-slider__thumb" />
                  <TimeSlider.Preview
                    overflow="visible"
                    className="media-slider__preview"
                  >
                    <div className="media-surface media-thumbnail media-slider__thumbnail">
                      <Slider.Thumbnail className="media-thumbnail__image" />
                      <SpinnerIcon className="media-thumbnail__spinner media-icon" />
                    </div>
                    <div className="media-slider__value">
                      <TimeSlider.ChapterTitle className="media-slider__chapter-title" />
                      <TimeSlider.Value type="pointer" className="media-time" />
                    </div>
                  </TimeSlider.Preview>
                </TimeSlider.Root>
                <Time.Value toggle type="remaining" className="media-time" />
              </div>
              <div className="media-button-group">
                <Tooltip.Root side="top">
                  <Tooltip.Trigger
                    render={
                      <CaptionsButton
                        className="media-button--captions"
                        render={<Button />}
                      >
                        <CaptionsOffIcon className="media-icon media-icon--captions-off" />
                        <CaptionsOnIcon className="media-icon media-icon--captions-on" />
                      </CaptionsButton>
                    }
                  />
                  <Tooltip.Popup className="media-surface media-tooltip">
                    <Tooltip.Label />
                    <Tooltip.Shortcut className="media-tooltip__kbd" />
                  </Tooltip.Popup>
                </Tooltip.Root>
                <SettingsMenu />
              </div>
            </div>
            <div className="media-surface media-controls media-controls--secondary">
              <div className="media-button-group">
                <PiPControl />
                <FullscreenControl />
              </div>
            </div>
          </Tooltip.Provider>
        </Controls.Root>
        <div className="media-overlay" />
        <Hotkey keys="Space" action="togglePaused" />
        <Hotkey keys="k" action="togglePaused" />
        <Hotkey keys="m" action="toggleMuted" />
        <Hotkey keys="f" action="toggleFullscreen" />
        <Hotkey keys="c" action="toggleSubtitles" />
        <Hotkey keys="i" action="togglePictureInPicture" />
        <Hotkey keys="ArrowRight" action="seekStep" value={SEEK_TIME / 2} />
        <Hotkey keys="ArrowLeft" action="seekStep" value={-(SEEK_TIME / 2)} />
        <Hotkey keys="l" action="seekStep" value={SEEK_TIME} />
        <Hotkey keys="j" action="seekStep" value={-SEEK_TIME} />
        <Hotkey keys="ArrowUp" action="volumeStep" value={0.05} />
        <Hotkey keys="ArrowDown" action="volumeStep" value={-0.05} />
        <Hotkey keys="0-9" action="seekToPercent" />
        <Hotkey keys="Home" action="seekToPercent" value={0} />
        <Hotkey keys="End" action="seekToPercent" value={100} />
        <Hotkey keys=">" action="speedUp" />
        <Hotkey keys="<" action="speedDown" />
        <Gesture
          type="tap"
          action="togglePaused"
          pointer="mouse"
          region="center"
        />
        <Gesture type="tap" action="toggleControls" pointer="touch" />
        <Gesture
          type="doubletap"
          action="seekStep"
          value={-SEEK_TIME}
          region="left"
        />
        <Gesture type="doubletap" action="toggleFullscreen" region="center" />
        <Gesture
          type="doubletap"
          action="seekStep"
          value={SEEK_TIME}
          region="right"
        />
        <StatusAnnouncer className="media-sr-only" />
        <div className="media-input-indicator-overlay">
          <VolumeIndicator.Root className="media-surface media-volume-indicator">
            <VolumeIndicator.Fill className="media-volume-indicator__content">
              <VolumeHighIcon className="media-icon media-icon--volume-high" />
              <VolumeLowIcon className="media-icon media-icon--volume-low" />
              <VolumeOffIcon className="media-icon media-icon--volume-off" />
              <VolumeIndicator.Value className="media-volume-indicator__value" />
            </VolumeIndicator.Fill>
          </VolumeIndicator.Root>
          <StatusIndicator.Root
            actions={TOP_STATUS_ACTIONS}
            className="media-surface media-status-indicator media-status-indicator--state"
          >
            <div className="media-status-indicator__content">
              <CaptionsOnIcon className="media-icon media-icon--captions-on" />
              <CaptionsOffIcon className="media-icon media-icon--captions-off" />
              <FullscreenEnterIcon className="media-icon media-icon--fullscreen-enter" />
              <FullscreenExitIcon className="media-icon media-icon--fullscreen-exit" />
              <PipEnterIcon className="media-icon media-icon--pip-enter" />
              <PipExitIcon className="media-icon media-icon--pip-exit" />
              <StatusIndicator.Value className="media-status-indicator__value" />
            </div>
          </StatusIndicator.Root>
          <SeekIndicator.Root className="media-seek-indicator">
            <ChevronIcon className="media-icon media-icon--seek" />
            <SeekIndicator.Value className="media-seek-indicator__value" />
          </SeekIndicator.Root>
          <StatusIndicator.Root
            actions={CENTER_STATUS_ACTIONS}
            className="media-status-indicator media-status-indicator--playback"
          >
            <PlayIcon className="media-icon media-icon--play" />
            <PauseIcon className="media-icon media-icon--pause" />
          </StatusIndicator.Root>
        </div>
      </Container>
    </Player>
  );
}

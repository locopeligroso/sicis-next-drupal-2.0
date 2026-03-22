'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Player from '@vimeo/player';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Typography } from '@/components/composed/Typography';
import { PlayIcon, PauseIcon, Volume2Icon, VolumeOffIcon, MaximizeIcon, MinimizeIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VimeoPlayerProps {
  videoCode: string;
  posterSrc?: string | null;
  posterAlt?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function VimeoPlayer({
  videoCode,
  posterSrc,
  posterAlt = '',
  className,
}: VimeoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const [isStarted, setIsStarted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const initPlayer = useCallback(async () => {
    if (!iframeRef.current || playerRef.current) return;

    const player = new Player(iframeRef.current);
    playerRef.current = player;

    await player.ready();

    const dur = await player.getDuration();
    setDuration(dur);

    player.on('timeupdate', (data) => {
      setCurrentTime(data.seconds);
    });

    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    player.on('volumechange', (data) => {
      setVolume(data.volume);
      setIsMuted(data.volume === 0);
    });

    await player.play();
    setIsPlaying(true);
    setIsStarted(true);
  }, []);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
    };
  }, []);

  const togglePlay = async () => {
    const player = playerRef.current;
    if (!player) return;
    const paused = await player.getPaused();
    paused ? await player.play() : await player.pause();
  };

  const handleSeek = (value: number | readonly number[]) => {
    const v = typeof value === 'number' ? value : value[0];
    playerRef.current?.setCurrentTime(v);
    setCurrentTime(v);
  };

  const handleVolume = (value: number | readonly number[]) => {
    const v = typeof value === 'number' ? value : value[0];
    playerRef.current?.setVolume(v);
    setVolume(v);
    setIsMuted(v === 0);
  };

  const toggleMute = async () => {
    const player = playerRef.current;
    if (!player) return;
    const muted = await player.getMuted();
    await player.setMuted(!muted);
    setIsMuted(!muted);
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      wrapperRef.current.requestFullscreen();
    }
  };

  return (
    <div ref={wrapperRef} className={cn('flex flex-col', className)}>
      {/* Video area */}
      <div className="relative overflow-hidden rounded-lg bg-muted">
        {/* Poster overlay */}
        {!isStarted && (
          <div className="relative aspect-video">
            {posterSrc ? (
              <img
                src={posterSrc}
                alt={posterAlt}
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-muted" />
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Button variant="outline" size="icon" onClick={initPlayer} className="size-20 rounded-full bg-background/80 text-primary shadow-lg backdrop-blur-sm hover:bg-background/90 hover:text-primary">
                <PlayIcon data-icon />
              </Button>
            </div>
          </div>
        )}

        {/* Vimeo iframe */}
        <iframe
          ref={iframeRef}
          src={`https://player.vimeo.com/video/${videoCode}?controls=0&dnt=1&keyboard=0`}
          className={cn('aspect-video w-full', !isStarted && 'hidden')}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video"
        />
      </div>

      {/* Custom controls — always in DOM to reserve space */}
      <div className={cn('flex items-center gap-2 rounded-b-lg bg-card px-4 py-2', !isStarted && 'invisible')}>
        <Button
          variant="ghost"
          size="icon"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          tabIndex={isStarted ? 0 : -1}
        >
          {isPlaying ? (
            <PauseIcon data-icon />
          ) : (
            <PlayIcon data-icon />
          )}
        </Button>

        <Typography textRole="caption" as="span" className="min-w-[4.5rem] tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </Typography>

        <Slider
          value={[currentTime]}
          onValueChange={handleSeek}
          min={0}
          max={duration || 1}
          step={0.1}
          className="flex-1"
          aria-label="Video progress"
        />

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          tabIndex={isStarted ? 0 : -1}
        >
          {isMuted ? (
            <VolumeOffIcon data-icon />
          ) : (
            <Volume2Icon data-icon />
          )}
        </Button>

        <div className="w-20 shrink-0">
          <Slider
            value={[isMuted ? 0 : volume]}
            onValueChange={handleVolume}
            min={0}
            max={1}
            step={0.01}
            aria-label="Volume"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          tabIndex={isStarted ? 0 : -1}
        >
          {isFullscreen ? (
            <MinimizeIcon data-icon />
          ) : (
            <MaximizeIcon data-icon />
          )}
        </Button>
      </div>
    </div>
  );
}

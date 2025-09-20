"use client";

import React from "react";
import PlayIcon from "./Icons/PlayIcon";
import PauseIcon from "./Icons/PauseIcon";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

interface VoiceProps {
  isPlaying?: boolean;
  onPlay?: () => void;
  className?: string;
  audioSrc: string;
}

const Voice: React.FC<VoiceProps> = ({ onPlay, className, audioSrc }) => {
  const {
    playing,
    error,
    audioDuration,
    progressRef,
    handlePlay,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getProgress,
    formatTime,
  } = useAudioPlayer({ audioSrc, onPlay });

  if (error) {
    return (
      <div
        className={`w-[303px] rounded-xl bg-stone-50 p-2.5 ${className || ""}`}
      >
        <p className="text-xs text-center text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`flex w-[303px] flex-row-reverse items-center gap-2 rounded-xl bg-stone-50 p-2.5 ${
        className || ""
      }`}
    >
      <button
        onClick={handlePlay}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-500"
        disabled={!audioDuration}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div
        ref={progressRef}
        className="flex cursor-pointer touch-none flex-row-reverse items-center gap-1.5"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {Array.from({ length: 26 }).map((_, i) => (
          <div
            key={i}
            className={`w-0.5 rounded-full transition-all duration-200 ${
              i < getProgress() ? "bg-pink-500" : "bg-slate-300"
            } ${i % 3 === 0 ? "h-6" : i % 2 === 0 ? "h-4" : "h-2"}`}
          />
        ))}
      </div>

      <div className="text-xs ml-auto flex gap-2 text-neutral-500">
        <span>{formatTime(audioDuration)}</span>
      </div>
    </div>
  );
};

export default Voice;

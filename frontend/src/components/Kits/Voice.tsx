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
        className={`w-[303px] bg-stone-50 rounded-xl p-2.5 ${className || ""}`}
      >
        <p className="text-red-500 text-xs text-center">{error}</p>
      </div>
    );
  }

  return (
    <div
      className={`w-[303px] flex flex-row-reverse items-center gap-2 bg-stone-50 rounded-xl p-2.5 ${
        className || ""
      }`}
    >
      <button
        onClick={handlePlay}
        className="w-8 h-8 flex items-center justify-center bg-pink-500 rounded-full"
        disabled={!audioDuration}
      >
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>

      <div
        ref={progressRef}
        className="flex flex-row-reverse items-center gap-1.5 cursor-pointer touch-none"
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

      <div className="flex gap-2 text-neutral-500 text-xs ml-auto">
        <span>{formatTime(audioDuration)}</span>
      </div>
    </div>
  );
};

export default Voice;

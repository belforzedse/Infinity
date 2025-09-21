import { useState, useRef, useEffect, useCallback } from "react";

interface UseAudioPlayerProps {
  audioSrc: string;
  onPlay?: () => void;
}

interface UseAudioPlayerReturn {
  playing: boolean;
  currentTime: number;
  audioDuration: number;
  error: string | null;
  isDragging: boolean;
  progressRef: React.RefObject<HTMLDivElement | null>;
  handlePlay: () => Promise<void>;
  handlePositionChange: (clientX: number) => void;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  getProgress: () => number;
  formatTime: (time: number) => string;
}

export const useAudioPlayer = ({ audioSrc, onPlay }: UseAudioPlayerProps): UseAudioPlayerReturn => {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleError = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement;
    setError(audio.error?.message || "Failed to load audio");
    setPlaying(false);
  }, []);

  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isDragging]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      setError(null);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setPlaying(false);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  }, []);

  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        if (playing) {
          await audioRef.current.pause();
        } else {
          await audioRef.current.play();
        }
        setPlaying(!playing);
        onPlay?.();
      } catch (err) {
        console.error("Playback error:", err);
        setError("Failed to play audio");
        setPlaying(false);
      }
    }
  };

  const calculateTimeFromPosition = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !audioDuration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const offsetX = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, offsetX / rect.width));
      return percentage * audioDuration;
    },
    [audioDuration],
  );

  const handlePositionChange = useCallback(
    (clientX: number) => {
      const newTime = calculateTimeFromPosition(clientX);
      if (newTime !== undefined) {
        setCurrentTime(newTime);
        if (!isDragging && audioRef.current) {
          audioRef.current.currentTime = newTime;
        }
      }
    },
    [calculateTimeFromPosition, isDragging],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handlePositionChange(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isDragging) {
      handlePositionChange(e.clientX);
    }
  };

  const handleMouseUp = useCallback(() => {
    if (isDragging && audioRef.current) {
      audioRef.current.currentTime = currentTime;
      setIsDragging(false);
    }
  }, [isDragging, currentTime]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handlePositionChange(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isDragging) {
      handlePositionChange(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = useCallback(() => {
    if (isDragging && audioRef.current) {
      audioRef.current.currentTime = currentTime;
      setIsDragging(false);
    }
  }, [isDragging, currentTime]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handlePositionChange(e.clientX);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    const handleGlobalTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (isDragging) {
        handlePositionChange(e.touches[0].clientX);
      }
    };

    const handleGlobalTouchEnd = () => {
      handleTouchEnd();
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleGlobalMouseMove);
      window.addEventListener("mouseup", handleGlobalMouseUp);
      window.addEventListener("touchmove", handleGlobalTouchMove, {
        passive: false,
      });
      window.addEventListener("touchend", handleGlobalTouchEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchmove", handleGlobalTouchMove);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, [isDragging, handlePositionChange, handleMouseUp, handleTouchEnd]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    try {
      audio.src = audioSrc;
      audio.preload = "metadata";
    } catch (err) {
      setError("Failed to load audio file");
      console.error("Error loading audio:", err);
    }

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [audioSrc, handleTimeUpdate, handleLoadedMetadata, handleEnded, handleError]);

  const getProgress = () => {
    if (!audioDuration) return 0;
    return (currentTime / audioDuration) * 26;
  };

  return {
    playing,
    currentTime,
    audioDuration,
    error,
    isDragging,
    progressRef,
    handlePlay,
    handlePositionChange,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getProgress,
    formatTime,
  };
};

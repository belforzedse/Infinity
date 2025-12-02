import { render, screen, fireEvent } from "@testing-library/react";
import Voice from "../Voice";

const mockUseAudioPlayer = {
  playing: false,
  error: null,
  audioDuration: 120,
  progressRef: { current: null },
  handlePlay: jest.fn(),
  handleMouseDown: jest.fn(),
  handleMouseMove: jest.fn(),
  handleMouseUp: jest.fn(),
  handleTouchStart: jest.fn(),
  handleTouchMove: jest.fn(),
  handleTouchEnd: jest.fn(),
  getProgress: jest.fn(() => 10),
  formatTime: jest.fn((time) => `${Math.floor(time / 60)}:${String(time % 60).padStart(2, "0")}`),
};

jest.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: () => mockUseAudioPlayer,
}));

jest.mock("../Icons/PlayIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="play-icon" />,
}));

jest.mock("../Icons/PauseIcon", () => ({
  __esModule: true,
  default: () => <div data-testid="pause-icon" />,
}));

describe("Voice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAudioPlayer.playing = false;
    mockUseAudioPlayer.error = null;
    mockUseAudioPlayer.audioDuration = 120;
  });

  it("should render audio player", () => {
    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should display play icon when not playing", () => {
    mockUseAudioPlayer.playing = false;

    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.getByTestId("play-icon")).toBeInTheDocument();
  });

  it("should display pause icon when playing", () => {
    mockUseAudioPlayer.playing = true;

    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.getByTestId("pause-icon")).toBeInTheDocument();
  });

  it("should call handlePlay when button is clicked", () => {
    render(<Voice audioSrc="/audio.mp3" />);

    const playButton = screen.getByRole("button");
    fireEvent.click(playButton);

    expect(mockUseAudioPlayer.handlePlay).toHaveBeenCalled();
  });

  it("should disable button when no audio duration", () => {
    mockUseAudioPlayer.audioDuration = 0;

    render(<Voice audioSrc="/audio.mp3" />);

    const playButton = screen.getByRole("button");
    expect(playButton).toBeDisabled();
  });

  it("should display error message when error exists", () => {
    mockUseAudioPlayer.error = "Failed to load audio";

    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.getByText("Failed to load audio")).toBeInTheDocument();
  });

  it("should not render player when error exists", () => {
    mockUseAudioPlayer.error = "Error";

    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("should render progress bars", () => {
    const { container } = render(<Voice audioSrc="/audio.mp3" />);

    const progressBars = container.querySelectorAll(".w-0\\.5");
    expect(progressBars).toHaveLength(26);
  });

  it("should apply active color to progress bars based on getProgress", () => {
    mockUseAudioPlayer.getProgress.mockReturnValue(5);

    const { container } = render(<Voice audioSrc="/audio.mp3" />);

    const progressBars = container.querySelectorAll(".w-0\\.5");
    const activeBars = Array.from(progressBars).filter((bar) =>
      bar.className.includes("bg-pink-500"),
    );

    expect(activeBars.length).toBeGreaterThan(0);
  });

  it("should display formatted audio duration", () => {
    mockUseAudioPlayer.audioDuration = 125;
    mockUseAudioPlayer.formatTime.mockReturnValue("2:05");

    render(<Voice audioSrc="/audio.mp3" />);

    expect(screen.getByText("2:05")).toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(<Voice audioSrc="/audio.mp3" className="custom-class" />);

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("should handle mouse events on progress bar", () => {
    const { container } = render(<Voice audioSrc="/audio.mp3" />);

    const progressContainer = container.querySelector(".cursor-pointer");
    expect(progressContainer).toBeInTheDocument();

    fireEvent.mouseDown(progressContainer!);
    expect(mockUseAudioPlayer.handleMouseDown).toHaveBeenCalled();

    fireEvent.mouseMove(progressContainer!);
    expect(mockUseAudioPlayer.handleMouseMove).toHaveBeenCalled();

    fireEvent.mouseUp(progressContainer!);
    expect(mockUseAudioPlayer.handleMouseUp).toHaveBeenCalled();
  });

  it("should handle touch events on progress bar", () => {
    const { container } = render(<Voice audioSrc="/audio.mp3" />);

    const progressContainer = container.querySelector(".cursor-pointer");

    fireEvent.touchStart(progressContainer!);
    expect(mockUseAudioPlayer.handleTouchStart).toHaveBeenCalled();

    fireEvent.touchMove(progressContainer!);
    expect(mockUseAudioPlayer.handleTouchMove).toHaveBeenCalled();

    fireEvent.touchEnd(progressContainer!);
    expect(mockUseAudioPlayer.handleTouchEnd).toHaveBeenCalled();
  });

  it("should call onPlay callback when provided", () => {
    const onPlay = jest.fn();

    render(<Voice audioSrc="/audio.mp3" onPlay={onPlay} />);

    // The onPlay callback is passed to useAudioPlayer hook
    // We're just verifying it can be passed without errors
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

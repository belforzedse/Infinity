import ChevronLeftIcon from "./Icons/ChevronLeftIcon";
import ChevronRightIcon from "./Icons/ChevronRightIcon";

type Props = {
  goToNextImage: () => void;
  goToPreviousImage: () => void;
};

export default function PDPHeroNavigationButtons(props: Props) {
  const { goToNextImage, goToPreviousImage } = props;

  return (
    <div className="flex gap-3">
      <button
        className="pressable z-10 flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white text-neutral-700 transition-colors hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={goToNextImage}
      >
        <ChevronRightIcon />
      </button>

      <button
        className="pressable z-10 flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white text-neutral-700 transition-colors hover:bg-pink-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        onClick={goToPreviousImage}
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}

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
        className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white"
        onClick={goToNextImage}
      >
        <ChevronRightIcon />
      </button>

      <button
        className="z-10 flex h-8 w-8 items-center justify-center rounded-full border border-pink-200 bg-white"
        onClick={goToPreviousImage}
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}

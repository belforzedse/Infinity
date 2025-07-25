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
        className="rounded-full w-8 h-8 bg-white flex items-center justify-center z-10 border border-pink-200"
        onClick={goToNextImage}
      >
        <ChevronRightIcon />
      </button>

      <button
        className="rounded-full w-8 h-8 bg-white flex items-center justify-center z-10 border border-pink-200"
        onClick={goToPreviousImage}
      >
        <ChevronLeftIcon />
      </button>
    </div>
  );
}

import LeftCarouselIcon from "./Icons/LeftCarouselIcon";
import clsx from "clsx";

interface Props {
  onClick: () => void;
  isNextStepShown?: boolean;
  hasBackButton: boolean;
  currentTitle: string;
  nextStepTitle?: string;
  icon?: React.ReactNode;
}

const BreadCrumb = ({
  onClick,
  isNextStepShown = false,
  hasBackButton,
  currentTitle,
  nextStepTitle = "",
  icon,
}: Props) => {
  const isNextStep = isNextStepShown && hasBackButton;

  return (
    <>
      <span className="text-foreground-primary text-3xl lg:hidden">
        حساب من
      </span>
      <div className="flex items-center justify-between w-full">
        <span className="text-foreground-primary lg:text-4xl text-xl">
          {isNextStep ? nextStepTitle : currentTitle}
        </span>

        <button
          onClick={onClick}
          className={clsx(
            isNextStep
              ? "bg-pink-500 text-white rounded-lg p-2"
              : "flex items-center gap-1 py-2 px-4 bg-background-secondary rounded-lg"
          )}
        >
          {isNextStep ? (
            <LeftCarouselIcon />
          ) : (
            <>
              {icon}
              <span className="text-sm text-[#333333]">{nextStepTitle}</span>
            </>
          )}
        </button>
      </div>
    </>
  );
};

export default BreadCrumb;

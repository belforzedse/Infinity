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
      <span className="text-3xl text-foreground-primary lg:hidden">حساب من</span>
      <div className="flex w-full items-center justify-between">
        <span className="text-xl text-foreground-primary lg:text-4xl">
          {isNextStep ? nextStepTitle : currentTitle}
        </span>

        <button
          onClick={onClick}
          className={clsx(
            isNextStep
              ? "rounded-lg bg-pink-500 p-2 text-white"
              : "flex items-center gap-1 rounded-lg bg-background-secondary px-4 py-2",
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

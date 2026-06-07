import StarIcon from "../../Icons/StarIcon";

type Props = {
  commentCount: number;
  rateCount: number;
  /** Kept for API compatibility; view count is intentionally not displayed to customers. */
  last24hoursSeenCount?: number;
};

export default function PDPHeroInfoCommentsInfo(props: Props) {
  const { commentCount, rateCount } = props;

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <span className="text-base text-foreground-primary">
          <span className="cursor-pointer text-actions-link underline">
            {commentCount > 0 ? `${commentCount} دیدگاه` : "بدون دیدگاه"}
          </span>{" "}
          برای این محصول
        </span>

        {rateCount > 0 && (
          <>
            <div className="h-[24px] w-[1px] bg-slate-300" />

            <div className="flex items-center gap-1">
              <span className="text-sm text-foreground-primary md:text-xs">({rateCount}) نفر</span>

              <StarIcon />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

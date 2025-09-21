import Image from "next/image";
import StarIcon from "../../Icons/StarIcon";

type Props = {
  commentCount: number;
  rateCount: number;
  last24hoursSeenCount: number;
};

export default function PDPHeroInfoCommentsInfo(props: Props) {
  const { commentCount, rateCount, last24hoursSeenCount } = props;

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

      {last24hoursSeenCount > 0 && (
        <div className="mt-2 flex items-center gap-1 md:mt-0">
          <Image width={16} height={16} alt="eye icon" src="/images/icons/eye.png" />

          <span className="text-sm text-foreground-primary md:text-xs">
            محصول محبوب!
            <span className="text-[#DB2777]"> {last24hoursSeenCount} نفر </span> در
            <span className="text-[#DB2777]"> 24 ساعت </span>
            گذشته آن را دیده اند!
          </span>
        </div>
      )}
    </div>
  );
}

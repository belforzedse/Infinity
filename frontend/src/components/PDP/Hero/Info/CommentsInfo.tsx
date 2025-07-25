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
    <div className="flex md:items-center md:justify-between flex-col md:flex-row">
      <div className="flex gap-3 items-center">
        <span className="text-base text-foreground-primary">
          <span className="text-actions-link underline cursor-pointer">
            {commentCount > 0 ? `${commentCount} دیدگاه` : "بدون دیدگاه"}
          </span>{" "}
          برای این محصول
        </span>

        {rateCount > 0 && (
          <>
            <div className="w-[1px] h-[24px] bg-slate-300" />

            <div className="flex gap-1 items-center">
              <span className="text-sm md:text-xs text-foreground-primary">
                ({rateCount}) نفر
              </span>

              <StarIcon />
            </div>
          </>
        )}
      </div>

      {last24hoursSeenCount > 0 && (
        <div className="flex gap-1 items-center mt-2 md:mt-0">
          <Image
            width={16}
            height={16}
            alt="eye icon"
            src="/images/icons/eye.png"
          />

          <span className="text-sm md:text-xs text-foreground-primary">
            محصول محبوب!
            <span className="text-[#DB2777]">
              {" "}
              {last24hoursSeenCount} نفر{" "}
            </span>{" "}
            در
            <span className="text-[#DB2777]"> 24 ساعت </span>
            گذشته آن را دیده اند!
          </span>
        </div>
      )}
    </div>
  );
}

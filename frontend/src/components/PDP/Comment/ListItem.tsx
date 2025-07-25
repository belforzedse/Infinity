import ReplyIcon from "../Icons/ReplyIcon";
import ThumbsDownIcon from "../Icons/ThumbsDownIcon";
import ThumbsUpIcon from "../Icons/ThumbsUpIcon";
import StarIcon from "../Icons/StarIcon";
import EmptyStarIcon from "../Icons/EmptyStarIcon";

type Props = {
  username: string;
  date: Date;
  comment: string;
  plusRating: number;
  minusRating: number;
  rating: number;

  reply?: {
    username: string;
    date: Date;
    comment: string;
    plusRating: number;
    minusRating: number;
  };
};

export default function PDPCommentListItem(props: Props) {
  const { username, date, comment, plusRating, minusRating, rating, reply } =
    props;

  // Format date with error handling
  const formatDate = (dateObj: Date) => {
    try {
      return dateObj
        .toLocaleString("fa-IR", {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
        .replace("ساعت", "، ");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "تاریخ نامشخص";
    }
  };

  return (
    <div className="p-6 border border-slate-100 rounded-3xl bg-background-secondary">
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-2 items-center">
              <span className="text-neutral-600 text-lg">
                {username || "کاربر مهمان"}
              </span>

              <button>
                <ReplyIcon />
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <div className="flex items-center gap-0.5">
                <span className="text-neutral-600 text-xs">{minusRating}</span>

                <button>
                  <ThumbsDownIcon />
                </button>
              </div>

              <div className="flex items-center gap-0.5">
                <span className="text-neutral-600 text-xs">{plusRating}</span>

                <button>
                  <ThumbsUpIcon />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[#b3b6b3] text-xs">{formatDate(date)}</span>

            <div className="flex flex-row-reverse items-center gap-1">
              {new Array(5)
                .fill(0)
                .map((_, index) =>
                  index + 1 > rating ? (
                    <EmptyStarIcon key={index} className="w-4 h-4" />
                  ) : (
                    <StarIcon key={index} className="w-4 h-4" />
                  )
                )}
            </div>
          </div>
        </div>

        <p className="text-neutral-600 text-sm">
          {comment ? comment.trim() || "بدون متن" : "بدون متن"}
        </p>

        {reply && (
          <div className="flex flex-col gap-2.5 p-4 rounded-3xl bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <span className="text-neutral-600 text-lg">
                    {reply.username || "پشتیبانی اینفینیتی"}
                  </span>
                </div>

                <span />
              </div>

              <span className="text-[#b3b6b3] text-xs">
                {formatDate(reply.date)}
              </span>
            </div>

            <p className="text-neutral-600 text-sm">
              {reply.comment ? reply.comment.trim() || "بدون متن" : "بدون متن"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

import {
  EmailIcon,
  EmailShareButton,
  FacebookIcon,
  FacebookShareButton,
  LinkedinIcon,
  LinkedinShareButton,
  TelegramIcon,
  TelegramShareButton,
  TwitterIcon,
  TwitterShareButton,
  WhatsappIcon,
  WhatsappShareButton,
} from "react-share";

interface ShareButtonsGridProps {
  shareUrl: string;
  shareText: string;
  productTitle: string;
  onShareClick: () => void;
}

export default function ShareButtonsGrid({
  shareUrl,
  shareText,
  productTitle,
  onShareClick,
}: ShareButtonsGridProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-gray-900">ارسال به</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <WhatsappShareButton
          url={shareUrl}
          title={shareText}
          separator=" "
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <WhatsappIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">واتساپ</span>
        </WhatsappShareButton>

        <TelegramShareButton
          url={shareUrl}
          title={shareText}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <TelegramIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">تلگرام</span>
        </TelegramShareButton>

        <TwitterShareButton
          url={shareUrl}
          title={shareText}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <TwitterIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">ایکس</span>
        </TwitterShareButton>

        <FacebookShareButton
          url={shareUrl}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <FacebookIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">فیسبوک</span>
        </FacebookShareButton>

        <LinkedinShareButton
          url={shareUrl}
          title={productTitle}
          summary={shareText}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <LinkedinIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">لینکدین</span>
        </LinkedinShareButton>

        <EmailShareButton
          url={shareUrl}
          subject={productTitle}
          body={shareText}
          className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-white ring-1 ring-black/5 transition hover:ring-pink-200 disabled:opacity-60"
          disabled={!shareUrl}
          onClick={onShareClick}
        >
          <EmailIcon size={34} round />
          <span className="text-sm font-medium text-gray-800">ایمیل</span>
        </EmailShareButton>
      </div>
    </div>
  );
}

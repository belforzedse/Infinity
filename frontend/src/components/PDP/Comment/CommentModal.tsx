import Modal from "@/components/Kits/Modal";
import { useState } from "react";
import EmptyStarIcon from "../Icons/EmptyStarIcon";
import StarIcon from "../Icons/StarIcon";
import SendCommentIcon from "../Icons/SendCommentIcon";
import { submitProductReview } from "@/services/product/reviews";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  commentCount: number;
  productId?: string;
}

export default function PDPCommentModal({
  isOpen,
  onClose,
  commentCount,
  productId,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setRating(0);
    setComment("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form validation
    if (rating === 0) {
      setFormError("لطفا یک امتیاز برای محصول انتخاب کنید");
      return;
    }

    if (comment.trim().length < 10) {
      setFormError("لطفا حداقل 10 کاراکتر برای دیدگاه خود وارد کنید");
      return;
    }

    if (!productId) {
      setFormError("خطا در شناسایی محصول");
      return;
    }

    // Clear any previous errors
    setFormError(null);
    setIsSubmitting(true);

    try {
      await submitProductReview(productId, rating, comment.trim());

      // Reset form and close modal on success
      resetForm();
      onClose();

      // Show success message
      toast.success(
        "دیدگاه شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد",
      );
    } catch (error: any) {
      console.error("Error submitting review:", error);

      // Handle authentication errors
      if (
        error.status === 401 ||
        error.status === 403 ||
        error.message === "Authentication required"
      ) {
        toast.error("لطفا ابتدا وارد حساب کاربری خود شوید");
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push("/auth");
        }, 1500);
        return;
      }

      setFormError("خطا در ثبت دیدگاه. لطفا مجددا تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetForm();
        onClose();
      }}
      className="max-w-xl"
      title="افزودن نظر"
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1 text-right">
          <p className="text-lg text-neutral-700">{commentCount} کامنت</p>

          <p className="text-base text-right text-neutral-500">
            شما هم از تجربه خریدتون برامون بنویسین
          </p>
        </div>

        {formError && (
          <div className="text-sm rounded-lg bg-red-50 p-3 text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            placeholder="نظر شما"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="h-32 resize-none rounded-lg border border-gray-200 p-3 text-right"
            required
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              به محصولات ما امتیاز بدین!
            </p>

            <div className="flex flex-row-reverse">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none"
                >
                  {star <= rating ? <StarIcon /> : <EmptyStarIcon />}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className={`${
              isSubmitting ? "bg-gray-400" : "bg-actions-primary"
            } mt-5 flex w-full items-center justify-center gap-2 self-end rounded-xl px-6 py-3 text-white md:w-auto`}
            disabled={isSubmitting}
          >
            <span>{isSubmitting ? "در حال ارسال..." : "ثبت نظر"}</span>
            {!isSubmitting && <SendCommentIcon />}
          </button>
        </form>
      </div>
    </Modal>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  MessageSquare,
  User,
  Calendar,
  Reply,
  Send,
  X,
} from "lucide-react";
import { blogService, BlogComment } from "@/services/blog/blog.service";
import { resolveBlogCommentUserDisplayName } from "@/utils/blogCommentAuthorName";

interface BlogCommentsProps {
  postId: number;
  comments?: BlogComment[];
}

interface CommentForm {
  Content: string;
  parent_comment?: number;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ postId, comments: initialComments }) => {
  const [comments, setComments] = useState<BlogComment[]>(initialComments || []);
  const [loading, setLoading] = useState(!initialComments);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentForm>();

  useEffect(() => {
    if (!initialComments) {
      fetchComments();
    }
  }, [initialComments, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogComments(postId);
      setComments(response.data || []);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CommentForm) => {
    setIsSubmitting(true);
    try {
      await blogService.createBlogComment(postId, data.Content, replyingTo || undefined);

      // Reset form and reply state
      reset();
      setReplyingTo(null);

      // Refresh comments
      await fetchComments();

      toast.success("نظر شما با موفقیت ثبت شد و پس از تایید نمایش داده خواهد شد.");
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast.error("خطا در ثبت نظر. لطفاً دوباره تلاش کنید.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const approvedComments = comments.filter((comment) => comment.Status === "Approved");
  const topLevelComments = approvedComments.filter((comment) => !comment.parent_comment);

  const getCommentReplies = (commentId: number) => {
    return approvedComments.filter((comment) => comment.parent_comment?.id === commentId);
  };

  const CommentItem: React.FC<{ comment: BlogComment; isReply?: boolean }> = ({
    comment,
    isReply = false,
  }) => {
    const replies = getCommentReplies(comment.id);

    return (
      <div className={`${isReply ? "mr-8 mt-4" : "mb-4"}`}>
        <div className="rounded-xl bg-slate-50 p-4">
          {/* Comment Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100">
                <User className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <div className="font-medium text-neutral-900">
                  {resolveBlogCommentUserDisplayName(comment.user)}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(comment.Date || comment.createdAt).toLocaleDateString("fa-IR")}
                </div>
              </div>
            </div>

            {!isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-pink-600 transition-colors hover:bg-pink-50"
              >
                <Reply className="h-4 w-4" />
                پاسخ
              </button>
            )}
          </div>

          {/* Comment Content */}
          <div className="whitespace-pre-wrap text-sm text-neutral-700">{comment.Content}</div>
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mr-8 mt-4">
            <form
              onSubmit={handleSubmit((data) =>
                onSubmit({ ...data, parent_comment: comment.id })
              )}
            >
              <div className="mb-3">
                <textarea
                  {...register("Content", { required: "متن پاسخ الزامی است" })}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                  placeholder="پاسخ خود را بنویسید..."
                />
                {errors.Content && (
                  <p className="mt-1 text-sm text-red-600">{errors.Content.message}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {isSubmitting ? "در حال ارسال..." : "ارسال پاسخ"}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                  انصراف
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-4">
            {replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply={true} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-slate-200"></div>
            <div className="h-6 w-32 rounded bg-slate-200"></div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-24 rounded bg-slate-200"></div>
                    <div className="h-3 w-16 rounded bg-slate-200"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-full rounded bg-slate-200"></div>
                  <div className="h-4 w-3/4 rounded bg-slate-200"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
          <MessageSquare className="h-5 w-5 text-pink-600" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">
          نظرات ({approvedComments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <div className="mb-8 rounded-xl bg-slate-50 p-5">
        <h4 className="mb-4 font-medium text-neutral-800">نظر خود را بنویسید</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <textarea
              {...register("Content", {
                required: "متن نظر الزامی است",
                minLength: { value: 10, message: "نظر باید حداقل ۱۰ کاراکتر باشد" },
              })}
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
              placeholder="نظر خود را در مورد این مقاله بنویسید..."
            />
            {errors.Content && (
              <p className="mt-1 text-sm text-red-600">{errors.Content.message}</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">نظر شما پس از تایید نمایش داده خواهد شد</p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-pink-500 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "در حال ارسال..." : "ارسال نظر"}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      {topLevelComments.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="mx-auto mb-4 h-12 w-12 text-slate-200" />
          <p className="text-neutral-600">هنوز نظری ثبت نشده است</p>
          <p className="mt-1 text-sm text-neutral-500">اولین نفری باشید که نظر می‌دهد</p>
        </div>
      ) : (
        <div>
          {topLevelComments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogComments;

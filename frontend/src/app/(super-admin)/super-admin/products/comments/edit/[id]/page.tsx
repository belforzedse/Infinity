"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { useEffect, useState } from "react";
import type { Comment} from "./config";
import { config } from "./config";
import { useParams } from "next/navigation";
import { apiClient } from "@/services";
import toast from "react-hot-toast";

type CommentResponse = {
  id: string;
  attributes: {
    Rate: number;
    Content: string;
    Status: "Need for Review" | "Rejected" | "Accepted";
    Date: string;
    createdAt: string;
    updatedAt: string;
    user: {
      data: {
        id: number;
        attributes: {
          Phone: string;
          user_info: {
            data: {
              id: number;
              attributes: {
                FirstName: string;
                LastName: string;
              };
            };
          };
        };
      };
    };
  };
};

type Reaction = {
  id: string;
  attributes: {
    Type: "Like" | "Dislike";
    createdAt: string;
    updatedAt: string;
    user: {
      data: {
        id: number;
        attributes: {
          Phone: string;
        };
      };
    };
  };
};

export default function Page() {
  const [reactions, setReactions] = useState<Reaction[]>();
  const [comment, setComment] = useState<Comment>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reactionPages, setReactionPages] = useState<number>(1);
  const [revalidate, setRevalidate] = useState<number>(0);

  const { id } = useParams();

  useEffect(() => {
    apiClient
      .get(
        `/product-review-likes?populate[0]=user&filters[product_review][id][$eq]=${id}&pagination[page]=${reactionPages}&pagination[pageSize]=10`,
      )
      .then((res) => {
        setReactions((data) => [...(data || []), ...((res as any)?.data || [])]);
      })
      .catch((_err) => {
        toast.error("دریافت اطلاعات با خطا مواجه شد");
      });
  }, [reactionPages, id]);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get(`/product-reviews/${id}?populate[0]=user&populate[1]=user.user_info`)
      .then((res) => {
        const data = (res as any)?.data as CommentResponse;

        setComment({
          id: data?.id,
          message: data?.attributes?.Content,
          name:
            data?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.FirstName +
            " " +
            data?.attributes?.user?.data?.attributes?.user_info?.data?.attributes?.LastName,
          createdAt: new Date(data?.attributes?.createdAt),
          status: data?.attributes?.Status,
          username: data?.attributes?.user?.data?.attributes?.Phone,
          updatedAt: new Date(data?.attributes?.updatedAt),
        });
        setIsLoading(false);
      })
      .catch((_err) => {
        setError("دریافت اطلاعات با خطا مواجه شد");
        toast.error("دریافت اطلاعات با خطا مواجه شد");
        setIsLoading(false);
      });
  }, [id, revalidate]);

  const ReactionsTable = () => {
    return (
      <div className="w-full rounded-lg bg-white p-3 md:p-5">
        <h2 className="text-lg mb-2 text-right md:text-xl md:mb-4">واکنش ها</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 p-2 md:p-4">
          <table className="w-full">
            <thead>
              <tr className="rounded-xl bg-slate-50 px-2 text-right">
                <th className="text-xs px-1 py-2 font-medium text-gray-600 md:text-sm md:py-2.5">
                  شناسه کاربر
                </th>
                <th className="text-xs px-1 py-2 font-medium text-gray-600 md:text-sm md:py-2.5">
                  واکنش
                </th>
                <th className="text-xs px-1 py-2 text-left font-medium text-gray-600 md:text-sm md:py-2.5">
                  تاریخ ایجاد
                </th>
              </tr>
            </thead>
            <tbody>
              {reactions?.map((reaction) => (
                <tr key={reaction?.id} className="border-b border-gray-100">
                  <td className="text-xs py-2 md:text-sm md:py-3">
                    <a href="#" className="text-blue-500">
                      {reaction?.attributes?.user?.data?.attributes?.Phone}
                    </a>
                  </td>
                  <td className="text-xs py-2 md:text-sm md:py-3">
                    {reaction?.attributes?.Type === "Like" ? "لایک" : "دیسلایک"}
                  </td>
                  <td className="text-xs py-2 text-left text-slate-500 md:text-sm md:py-3">
                    {new Date(reaction?.attributes?.createdAt).toLocaleString("fa-IR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="py-2 md:py-3">
                  <div className="flex justify-center">
                    <button
                      className="text-xs flex items-center text-gray-500 md:text-sm"
                      onClick={() => setReactionPages(reactionPages + 1)}
                    >
                      <span className="ml-2">مشاهده بیشتر</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="md:h-4 md:w-4"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading comment data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <UpsertPageContentWrapper<Comment>
      config={config}
      data={comment}
      footer={ReactionsTable}
      onSubmit={async (data) => {
        setIsLoading(true);
        try {
          await apiClient.put(`/product-reviews/${id}`, {
            data: {
              Status: data?.status,
              Content: data?.message,
            },
          });
          setRevalidate(revalidate + 1);
          toast.success("ویرایش با موفقیت انجام شد");
        } catch (error) {
          console.error("Error updating comment:", error);
          setError("دریافت اطلاعات با خطا مواجه شد");
          toast.error("دریافت اطلاعات با خطا مواجه شد");
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}

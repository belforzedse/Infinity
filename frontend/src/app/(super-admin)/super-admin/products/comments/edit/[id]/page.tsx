"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { useEffect, useState } from "react";
import { Comment, config } from "./config";
import { useParams } from "next/navigation";
import { apiClient } from "@/services";
import toast from "react-hot-toast";
import { STRAPI_TOKEN } from "@/constants/api";

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
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        }
      )
      .then((res) => {
        setReactions((data) => [
          ...(data || []),
          ...((res as any)?.data || []),
        ]);
      })
      .catch((err) => {
        toast.error("دریافت اطلاعات با خطا مواجه شد");
      });
  }, [reactionPages]);

  useEffect(() => {
    setIsLoading(true);
    apiClient
      .get(
        `/product-reviews/${id}?populate[0]=user&populate[1]=user.user_info`,
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        }
      )
      .then((res) => {
        const data = (res as any)?.data as CommentResponse;

        setComment({
          id: data?.id,
          message: data?.attributes?.Content,
          name:
            data?.attributes?.user?.data?.attributes?.user_info?.data
              ?.attributes?.FirstName +
            " " +
            data?.attributes?.user?.data?.attributes?.user_info?.data
              ?.attributes?.LastName,
          createdAt: new Date(data?.attributes?.createdAt),
          status: data?.attributes?.Status,
          username: data?.attributes?.user?.data?.attributes?.Phone,
          updatedAt: new Date(data?.attributes?.updatedAt),
        });
        setIsLoading(false);
      })
      .catch((err) => {
        setError("دریافت اطلاعات با خطا مواجه شد");
        toast.error("دریافت اطلاعات با خطا مواجه شد");
        setIsLoading(false);
      });
  }, [id, revalidate]);

  const ReactionsTable = () => {
    return (
      <div className="w-full bg-white rounded-lg p-3 md:p-5">
        <h2 className="text-lg md:text-xl text-right mb-2 md:mb-4">واکنش ها</h2>
        <div className="overflow-x-auto border border-slate-100 rounded-2xl p-2 md:p-4">
          <table className="w-full">
            <thead>
              <tr className="text-right px-2 bg-slate-50 rounded-xl">
                <th className="py-2 md:py-2.5 px-1 font-medium text-gray-600 text-xs md:text-sm">
                  شناسه کاربر
                </th>
                <th className="py-2 md:py-2.5 px-1 font-medium text-gray-600 text-xs md:text-sm">
                  واکنش
                </th>
                <th className="py-2 md:py-2.5 px-1 font-medium text-gray-600 text-left text-xs md:text-sm">
                  تاریخ ایجاد
                </th>
              </tr>
            </thead>
            <tbody>
              {reactions?.map((reaction) => (
                <tr key={reaction?.id} className="border-b border-gray-100">
                  <td className="py-2 md:py-3 text-xs md:text-sm">
                    <a href="#" className="text-blue-500 hover:underline">
                      {reaction?.attributes?.user?.data?.attributes?.Phone}
                    </a>
                  </td>
                  <td className="py-2 md:py-3 text-xs md:text-sm">
                    {reaction?.attributes?.Type === "Like" ? "لایک" : "دیسلایک"}
                  </td>
                  <td className="py-2 md:py-3 text-slate-500 text-left text-xs md:text-sm">
                    {new Date(reaction?.attributes?.createdAt).toLocaleString(
                      "fa-IR",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={3} className="py-2 md:py-3">
                  <div className="flex justify-center">
                    <button
                      className="flex items-center text-gray-500 text-xs md:text-sm"
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
                        className="md:w-4 md:h-4"
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
          await apiClient.put(
            `/product-reviews/${id}`,
            {
              data: {
                Status: data?.status,
                Content: data?.message,
              },
            },
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            }
          );
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

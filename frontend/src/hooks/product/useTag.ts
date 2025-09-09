import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import {
  editProductDataAtom,
  productDataAtom,
} from "@/atoms/super-admin/products";
import toast from "react-hot-toast";
import { createTag } from "@/services/super-admin/product/tag/create";
import {
  getTags,
  TagResponseType,
} from "@/services/super-admin/product/tag/get";
import { usePathname } from "next/navigation";
import logger from "@/utils/logger";

interface UseProductTagProps {
  isEditMode?: boolean;
}

export function useProductTag(props?: UseProductTagProps) {
  const { isEditMode = false } = props || {};

  const [productData, setProductData] = useAtom(
    isEditMode ? editProductDataAtom : productDataAtom,
  );
  const pathname = usePathname();
  const [tags, setTags] = useState<TagResponseType[]>(productData.product_tags);
  const [query, setQuery] = useState("");
  const [tagOptions, setTagOptions] = useState<TagResponseType[]>([]);
  const [isGetTagsLoading, setIsGetTagsLoading] = useState(false);
  const [isCreateTagLoading, setIsCreateTagLoading] = useState(false);

  useEffect(() => {
    if (!pathname.endsWith("/add") && productData.product_tags?.length > 0) {
      setTags(productData.product_tags);
      // Update tag options to exclude already selected tags
      handleFetchTags();
    }
  }, [pathname, productData.product_tags]);

  const handleFetchTags = async () => {
    try {
      setIsGetTagsLoading(true);
      const response = await getTags();
      setTagOptions(
        (response as any).filter(
          (tag: any) => !tags.some((existingTag) => existingTag.id === tag.id),
        ),
      );
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setIsGetTagsLoading(false);
    }
  };

  const handleCreateTag = async (title: string) => {
    try {
      setIsCreateTagLoading(true);
      const response = await createTag(title);

      // Debug the response structure
      if (process.env.NODE_ENV !== "production") {
        logger.info("Tag creation response", { response });
      }

      // Check if the response is successful
      if (response.data?.data?.id) {
        // Create the new tag object based on the actual response structure
        const newTag: TagResponseType = {
          id: (response as any).data?.id,
          attributes: {
            Title: (response as any).data?.attributes?.Title,
            createdAt: (response as any).data?.attributes?.createdAt,
            updatedAt: (response as any).data?.attributes?.updatedAt,
          },
        };

        if (process.env.NODE_ENV !== "production") {
          logger.info("New tag created", { newTag });
        }

        // Update the tags state
        const updatedTags = [...tags, newTag];
        setTags(updatedTags);

        // Update the tag options
        setTagOptions(tagOptions.filter((tag) => tag.id !== newTag.id));

        // Update the product data
        setProductData({
          ...(productData as any),
          product_tags: updatedTags,
        });

        // Clear the query input
        setQuery("");

        toast.success("تگ با موفقیت ایجاد شد");
      } else {
        // If the API returned success: false
        console.error("Tag creation failed:", response);
        toast.error("خطایی رخ داده است");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("خطایی رخ داده است");
    } finally {
      setIsCreateTagLoading(false);
    }
  };

  const filteredTags =
    query === ""
      ? tagOptions
      : tagOptions.filter((tag) =>
          tag.attributes.Title.replace(/\s/g, "")
            .toLowerCase()
            .includes(query.replace(/\s/g, "").toLowerCase()),
        );

  const handleSelect = (selectedTag: TagResponseType | null) => {
    if (!selectedTag) return;

    if (
      !tags.some((tag) => tag.id === selectedTag.id) &&
      tagOptions.some((tag) => tag.id === selectedTag.id)
    ) {
      const updatedTags = [...tags, selectedTag];
      setTags(updatedTags);
      setTagOptions(tagOptions.filter((tag) => tag.id !== selectedTag.id));
      setQuery("");
      setProductData({
        ...(productData as any),
        product_tags: updatedTags,
      });
    }
  };

  const removeTag = (tagToRemove: TagResponseType) => {
    const updatedTags = tags.filter((tag) => tag.id !== tagToRemove.id);
    setTags(updatedTags);
    setTagOptions([...tagOptions, tagToRemove]);
    setProductData({
      ...(productData as any),
      product_tags: updatedTags,
    });
  };

  return {
    tags,
    query,
    tagOptions,
    filteredTags,
    handleSelect,
    removeTag,
    setQuery,
    handleCreateTag,
    isGetTagsLoading,
    isCreateTagLoading,
    handleFetchTags,
  };
}

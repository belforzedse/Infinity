"use client";

/**
 * Three-up form row for the create-post flow: Title, Slug, Product Link.
 *
 * Layout follows the social shell's responsive convention — `flex-col` on
 * mobile so each field claims the full row width, `lg:grid-cols-3` on desktop
 * for a clean three-up arrangement. Inputs reuse [`SocialTextField`] so they
 * match the look used elsewhere in the profile section.
 *
 * Slug auto-derives from the title until the user types into the slug field,
 * after which it locks (`slugDirty=true` lifted to the parent).
 */

import Text from "@/components/Kits/Text";
import { SocialTextField } from "@/components/ui/SocialTextField";

export type PostFieldsRowProps = {
  title: string;
  onTitleChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  productLink: string;
  onProductLinkChange: (value: string) => void;
  disabled?: boolean;
};

export function PostFieldsRow({
  title,
  onTitleChange,
  slug,
  onSlugChange,
  productLink,
  onProductLinkChange,
  disabled,
}: PostFieldsRowProps) {
  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
      <div className="space-y-2">
        <label htmlFor="post-title" className="block text-right">
          <Text variant="label" className="!text-sm !text-zinc-600">
            عنوان
          </Text>
        </label>
        <SocialTextField
          id="post-title"
          name="title"
          value={title}
          onEdit={onTitleChange}
          disabled={disabled}
          placeholder="عنوان پست"
          className="w-full"
          maxLength={255}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="post-slug" className="block text-right">
          <Text variant="label" className="!text-sm !text-zinc-600">
            اسلاگ
          </Text>
        </label>
        <SocialTextField
          id="post-slug"
          name="slug"
          value={slug}
          onEdit={onSlugChange}
          disabled={disabled}
          placeholder="post-slug"
          className="w-full"
          dir="ltr"
          maxLength={150}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="post-product-link" className="block text-right">
          <Text variant="label" className="!text-sm !text-zinc-600">
            لینک محصول
          </Text>
        </label>
        <SocialTextField
          id="post-product-link"
          name="productLink"
          type="url"
          value={productLink}
          onEdit={onProductLinkChange}
          disabled={disabled}
          placeholder="https://example.com/product"
          className="w-full"
          dir="ltr"
          maxLength={500}
        />
      </div>
    </div>
  );
}

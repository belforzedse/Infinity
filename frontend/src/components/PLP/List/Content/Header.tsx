import PLPButton from "@/components/Kits/PLP/Button";
import Text from "@/components/Kits/Text";
import SortDescIcon from "../../Icons/SortDescIcon";
import Image from "next/image";

export default function PLPListContentHeader() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <Text className="!text-3xl text-foreground-primary">پوشاک زنانه</Text>

        <div className="hidden md:flex">
          <PLPButton
            text="مرتب سازی"
            rightIcon={<SortDescIcon className="h-6 w-6" />}
            className="!px-3 !py-2"
            fullWidth={false}
          />
        </div>
      </div>

      {/* Pills row */}
      <div className="mt-4 flex w-full justify-center">
        <div className="inline-flex items-center justify-center gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm">
          <PLPButton
            text="محبوب ترین محصولات"
            className="rounded-full bg-red-100 px-4 py-2 text-red-900"
            leftIcon={
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <Image
                  src="/images/heart-image-icon.png"
                  alt="heart"
                  width={18}
                  height={18}
                  loading="lazy"
                  sizes="18px"
                />
              </span>
            }
            fullWidth={false}
          />

          <PLPButton
            text="محصولات تخفیف دار"
            className="rounded-full bg-blue-100 px-4 py-2 text-blue-900"
            leftIcon={
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <Image
                  src="/images/100-image-icon.png"
                  alt="100"
                  width={18}
                  height={18}
                  loading="lazy"
                  sizes="18px"
                />
              </span>
            }
            fullWidth={false}
          />

          <PLPButton
            text="پر فروش ترین محصولات"
            className="rounded-full bg-orange-100 px-4 py-2 text-orange-900"
            leftIcon={
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white">
                <Image
                  src="/images/fire-image-icon.png"
                  alt="fire"
                  width={18}
                  height={18}
                  loading="lazy"
                  sizes="18px"
                />
              </span>
            }
            fullWidth={false}
          />
        </div>
      </div>
    </div>
  );
}

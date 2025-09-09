import PLPButton from "@/components/Kits/PLP/Button";
import Text from "@/components/Kits/Text";
import SortDescIcon from "../../Icons/SortDescIcon";
import Image from "next/image";

export default function PLPListContentHeader() {
  return (
    <div className="flex w-full items-center justify-between">
      <Text className="!text-3xl text-foreground-primary">پوشاک زنانه</Text>

      <div className="hidden items-center gap-2 md:flex">
        <PLPButton
          text="محبوب ترین محصولات"
          className="bg-red-100 text-red-900"
          leftIcon={
            <Image
              src="/images/heart-image-icon.png"
              alt="heart"
              width={20}
              height={20}
              loading="lazy"
              sizes="20px"
            />
          }
        />

        <PLPButton
          text="محصولات تخفیف دار"
          className="bg-blue-100 text-blue-900"
          leftIcon={
            <Image
              src="/images/100-image-icon.png"
              alt="100"
              width={20}
              height={25}
              loading="lazy"
              sizes="20px"
            />
          }
        />

        <PLPButton
          text="پر فروش ترین محصولات"
          className="bg-orange-100 text-orange-900"
          leftIcon={
            <Image
              src="/images/fire-image-icon.png"
              alt="fire"
              width={20}
              height={20}
              loading="lazy"
              sizes="20px"
            />
          }
        />
        <PLPButton
          text="مرتب سازی"
          rightIcon={<SortDescIcon className="h-6 w-6" />}
        />
      </div>
    </div>
  );
}

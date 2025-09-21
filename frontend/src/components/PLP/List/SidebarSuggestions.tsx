import Text from "@/components/Kits/Text";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import ProductSmallCard from "@/components/Product/SmallCard";

type Props = {
  title: string;
  icon: React.ReactNode;
  items: ProductSmallCardProps[];
};

export default function PLPListSidebarSuggestions({ title, icon, items }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-1">
        <div className="h-6 w-6">{icon}</div>
        <Text className="text-2xl text-foreground-primary">{title}</Text>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <ProductSmallCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  );
}

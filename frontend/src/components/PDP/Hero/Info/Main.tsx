import GridIcon from "@/components/Product/Icons/GridIcon";

type Props = {
  title: string;
  discount?: number;
  category: string;
};

export default function PDPHeroInfoMain(props: Props) {
  const { title, discount, category } = props;

  return (
    <div className="flex flex-col gap-1 md:gap-3">
      <div className="flex items-center justify-between">
        <span className="text-3xl text-foreground-primary">{title}</span>

        {discount ? (
          <div className="md:py-2 py-1 px-3 bg-[#E11D48] text-white text-sm !leading-5 flex items-center justify-center rounded-3xl">
            <span>{discount}% تخفیف</span>
          </div>
        ) : (
          <span />
        )}
      </div>

      <div className="flex gap-1 items-center">
        <GridIcon />
        <span className="text-foreground-muted text-sm md:text-lg">
          {category}
        </span>
      </div>
    </div>
  );
}

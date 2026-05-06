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
          <div className="text-sm flex items-center justify-center rounded-3xl bg-[#E11D48] px-3 py-1 !leading-5 text-white md:py-2">
            <span>{discount}% تخفیف</span>
          </div>
        ) : (
          <span />
        )}
      </div>

      <div className="flex items-center gap-1">
        <GridIcon />
        <span className="text-sm text-foreground-muted md:text-lg">{category}</span>
      </div>
    </div>
  );
}

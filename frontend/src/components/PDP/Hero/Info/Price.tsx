type Props = {
  price: number;
  discountPrice?: number;
  hasStock?: boolean;
};

export default function PDPHeroInfoPrice(props: Props) {
  const { price, discountPrice, hasStock = true } = props;

  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-primary text-xl">قیمت</span>

      <div className="flex items-center gap-3">
        {!hasStock ? (
          <span className="text-xl text-red-600 font-medium">ناموجود</span>
        ) : (
          <>
            {discountPrice ? (
              <span className="text-xl text-pink-600">
                {(discountPrice || price).toLocaleString("fa-IR")} تومان
              </span>
            ) : null}

            <span
              className={`${
                discountPrice
                  ? " text-foreground-muted line-through text-base"
                  : " text-neutral-700 text-xl"
              }`}
            >
              {price.toLocaleString("fa-IR")} تومان
            </span>
          </>
        )}
      </div>
    </div>
  );
}

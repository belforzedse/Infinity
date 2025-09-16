type Props = {
  price: number;
  discountPrice?: number;
  hasStock?: boolean;
};

import { faNum } from "@/utils/faNum";

export default function PDPHeroInfoPrice(props: Props) {
  const { price, discountPrice, hasStock = true } = props;

  return (
    <div className="flex items-center justify-between">
      <span className="text-xl text-foreground-primary">قیمت</span>

      <div className="flex items-center gap-3">
        {!hasStock ? (
          <span className="text-xl font-medium text-red-600">ناموجود</span>
        ) : (
          <>
            {discountPrice ? (
              <span className="text-xl text-pink-600">
                {faNum(discountPrice || price)} تومان
              </span>
            ) : null}

            <span
              className={`${
                discountPrice
                  ? "text-base text-foreground-muted line-through"
                  : "text-xl text-neutral-700"
              }`}
            >
              {faNum(price)} تومان
            </span>
          </>
        )}
      </div>
    </div>
  );
}

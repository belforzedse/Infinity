import PDPCommentAdd from "./Add";
import type { ProductReview } from "./List";
import PDPCommentList from "./List";

type Props = {
  rating: number;
  rateCount: number;
  productReviews: ProductReview[];
  productId?: string;
};

export default function PDPComment(props: Props) {
  const { rating, rateCount, productReviews, productId } = props;

  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row" data-comments-section>
      <div className="flex-1">
        <PDPCommentList reviews={productReviews} />
      </div>

      <div className="flex flex-col-reverse gap-4 md:w-[386px] md:flex-col">
        <PDPCommentAdd
          rating={rating}
          rateCount={rateCount}
          productReviews={productReviews}
          productId={productId}
        />
        {/* <PDPCommentAddSpecialOffer
          discountPrice={100000}
          price={150000}
          discount={15}
          endOfferDate={new Date(Date.now() + 400000)}
          title={"مانتو زنانه مدل پاییزه"}
          category={"لباس زمستانی زنانه"}
          imageSrc={"/images/pdp/image-1.png"}
        /> */}
      </div>
    </div>
  );
}

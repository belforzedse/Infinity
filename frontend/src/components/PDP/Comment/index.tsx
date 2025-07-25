import PDPCommentAdd from "./Add";
import PDPCommentList, { ProductReview } from "./List";

type Props = {
  rating: number;
  rateCount: number;
  productReviews: ProductReview[];
  productId?: string;
};

export default function PDPComment(props: Props) {
  const { rating, rateCount, productReviews, productId } = props;

  return (
    <div
      className="flex gap-4 flex-col-reverse md:flex-row"
      data-comments-section
    >
      <div className="flex-1">
        <PDPCommentList reviews={productReviews} />
      </div>

      <div className="flex flex-col-reverse md:flex-col gap-4 md:w-[386px]">
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

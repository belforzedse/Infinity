import DiscountIcon from "../Icons/DiscountIcon";
import HeartIcon from "../Icons/HeartIcon";
import SEOContent from "../SEOContent";
import Content from "./Content";
import Filter from "./Filter";
import PLPListMobileFilter from "./MobileFilter";
import SidebarSuggestions from "./SidebarSuggestions";

const heroBannerProducts = new Array(4).fill(null).map((_, index) => ({
  id: index + 1,
  title: `شال چهار خونه موهر S00361`,
  category: "شال و روسری",
  likedCount: 197,
  price: 419000,
  discountedPrice: 398000,
  discount: 20,
  image: `/images/clothes-sm.jpg`,
}));

export default function PLPList() {
  return (
    <div className="p-3 md:px-10 md:py-3">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="hidden w-[269px] flex-col gap-7 md:flex">
            <Filter />

            <SidebarSuggestions
              title="شاید بپسندید"
              icon={<HeartIcon />}
              items={heroBannerProducts}
            />

            <SidebarSuggestions
              title="تخفیف های آخرماه"
              icon={<DiscountIcon />}
              items={heroBannerProducts}
            />
          </div>

          <div className="md:hidden">
            <PLPListMobileFilter />
          </div>

          <div className="flex flex-1 flex-col gap-3">
            <Content />

            <div className="mt-3 flex flex-col gap-5">
              <SEOContent
                title="متن سئو اینجا قرار می گیرد"
                description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد."
                imageSrc="/images/seo.png"
                imageAlt="Alt"
                audioSrc="/audio/sample.mp3"
              />

              <SEOContent
                title="متن سئو اینجا قرار می گیرد"
                description="لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ، و با استفاده از طراحان گرافیک است، چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است، و برای شرایط فعلی تکنولوژی مورد نیاز، و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد، کتابهای زیادی در شصت و سه درصد گذشته حال و آینده، شناخت فراوان جامعه و متخصصان را می طلبد، تا با نرم افزارها شناخت بیشتری را برای طراحان رایانه ای علی الخصوص طراحان خلاقی، و فرهنگ پیشرو در زبان فارسی ایجاد کرد."
                imageSrc="/images/seo.png"
                imageAlt="Alt"
                audioSrc="/audio/sample.mp3"
                direction="ltr"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

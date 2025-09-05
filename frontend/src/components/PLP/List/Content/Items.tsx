import ProductCard from "@/components/Product/Card";
import ProductSmallCard from "@/components/Product/SmallCard";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

const products = new Array(20).fill(null).map((_, index) => {
  const template = [
    {
      id: 361,
      images: [
        "/images/products/scarf-1.png",
        "/images/products/scarf-2.png",
        "/images/products/scarf-3.png",
      ],
      category: "شال و روسری",
      title: "شال چهار خونه موهر S00361",
      price: 398000,
      seenCount: 577,
      discount: 20,
      discountPrice: 318400,
      colorsCount: 3,
    },
    {
      id: 362,
      images: [
        "/images/products/scarf-2.png",
        "/images/products/scarf-3.png",
        "/images/products/scarf-1.png",
      ],
      category: "شال و روسری",
      title: "شال ابریشم مجلسی طرح دار",
      price: 450000,
      seenCount: 142,
      colorsCount: 5,
    },
    {
      id: 363,
      images: [
        "/images/products/scarf-3.png",
        "/images/products/scarf-1.png",
        "/images/products/scarf-2.png",
      ],
      category: "شال و روسری",
      title: "روسری نخی ساده",
      price: 248000,
      seenCount: 89,
      discount: 15,
      discountPrice: 210800,
    },
  ][index % 3];

  return {
    ...template,
    id: 361 + index,
  };
});

export default function PLPListContentItems() {
  const DesktopRow = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>
      <ProductCard key={products[index].id} {...products[index]} />
    </div>
  );

  const MobileRow = ({ index, style }: ListChildComponentProps) => {
    const product = products[index];
    return (
      <div style={style}>
        <ProductSmallCard
          category={product.category}
          id={product.id}
          title={product.title}
          likedCount={product.seenCount}
          price={product.price}
          discountedPrice={product.discountPrice}
          image={product.images[0]}
          discount={product.discount}
        />
      </div>
    );
  };

  const LIST_HEIGHT = 600;
  const DESKTOP_ITEM_HEIGHT = 420;
  const MOBILE_ITEM_HEIGHT = 140;

  return (
    <>
      <div className="hidden md:block">
        <List
          height={LIST_HEIGHT}
          itemCount={products.length}
          itemSize={DESKTOP_ITEM_HEIGHT}
          width="100%"
        >
          {DesktopRow}
        </List>
      </div>

      <div className="md:hidden">
        <List
          height={LIST_HEIGHT}
          itemCount={products.length}
          itemSize={MOBILE_ITEM_HEIGHT}
          width="100%"
        >
          {MobileRow}
        </List>
      </div>
    </>
  );
}

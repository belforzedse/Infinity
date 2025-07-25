import ProductCard from "@/components/Product/Card";
import ProductSmallCard from "@/components/Product/SmallCard";

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
  return (
    <>
      <div className="hidden md:flex flex-wrap gap-3 justify-between">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      <div className="flex md:hidden flex-col gap-3">
        {products.map((product) => (
          <ProductSmallCard
            key={product.id}
            category={product.category}
            id={product.id}
            title={product.title}
            likedCount={product.seenCount}
            price={product.price}
            discountedPrice={product.discountPrice}
            image={product.images[0]}
            discount={product.discount}
          />
        ))}
      </div>
    </>
  );
}

export interface Category {
  id: number;
  name: string;
  image: string;
  backgroundColor: string;
  slug: string;
  width: number;
  height: number;
  href: string;
}

export const categories: Category[] = [
  {
    id: 1,
    name: "مانتو",
    image: "/images/categories/coat.webp",
    backgroundColor: "#FFF8E7",
    slug: "coat-and-mantle",
    width: 180,
    height: 248,
    href: "https://infinitycolor.co/shop/coat-and-mantle/",
  },
  {
    id: 2,
    name: "پلیور",
    image: "/images/categories/pullover.webp",
    backgroundColor: "#F0FFED",
    slug: "پلیور-و-بافت",
    width: 194,
    height: 219,
    href: "https://infinitycolor.co/shop/پلیور-و-بافت/",
  },
  {
    id: 3,
    name: "دامن",
    image: "/images/categories/skirt.webp",
    backgroundColor: "#FFF0ED",
    slug: "skirt",
    width: 214,
    height: 181,
    href: "https://infinitycolor.co/shop/skirt/",
  },
  {
    id: 4,
    name: "لباس زیر",
    image: "/images/categories/blouse.webp",
    backgroundColor: "#EDF6FF",
    slug: "under-wear",
    width: 183,
    height: 219,
    href: "https://infinitycolor.co/shop/under-wear/",
  },
  {
    id: 5,
    name: "شلوار",
    image: "/images/categories/pants.webp",
    backgroundColor: "#F0FFF7",
    slug: "pants",
    width: 154,
    height: 255,
    href: "https://infinitycolor.co/shop/pants/",
  },
  {
    id: 6,
    name: "شال و روسری",
    image: "/images/categories/scarf.webp",
    backgroundColor: "#FFF8E7",
    slug: "shawls-and-scarves",
    height: 212,
    width: 159,
    href: "https://infinitycolor.co/shop/shawls-and-scarves/",
  },
];

export default categories;

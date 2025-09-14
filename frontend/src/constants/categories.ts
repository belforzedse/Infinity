export interface Category {
  id: number;
  name: string;
  image: string;
  backgroundColor: string;
  slug: string;
  width: number;
  height: number;
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
  },
  {
    id: 2,
    name: "پلیور",
    image: "/images/categories/pullover.webp",
    backgroundColor: "#F0FFED",
    slug: "pullover",
    width: 194,
    height: 219,
  },
  {
    id: 3,
    name: "دامن",
    image: "/images/categories/skirt.webp",
    backgroundColor: "#FFF0ED",
    slug: "skirt",
    width: 214,
    height: 181,
  },
  {
    id: 4,
    name: "لباس زیر",
    image: "/images/categories/blouse.webp",
    backgroundColor: "#EDF6FF",
    slug: "underwear",
    width: 183,
    height: 219,
  },
  {
    id: 5,
    name: "شلوار",
    image: "/images/categories/pants.webp",
    backgroundColor: "#F0FFF7",
    slug: "pants",
    width: 154,
    height: 255,
  },
  {
    id: 6,
    name: "شال و روسری",
    image: "/images/categories/scarf.webp",
    backgroundColor: "#FFF8E7",
    slug: "shawls-and-scarves",
    height: 212,
    width: 159,
  },
];

export default categories;

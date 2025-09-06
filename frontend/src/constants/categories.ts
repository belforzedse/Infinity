export interface Category {
  id: number;
  name: string;
  image: string;
  backgroundColor: string;
  slug: string;
}

export const categories: Category[] = [
  {
    id: 1,
    name: "مانتو",
    image: "/images/categories/coat.png",
    backgroundColor: "#FFF8E7",
    slug: "coat-and-mantle",
  },
  {
    id: 2,
    name: "پلیور",
    image: "/images/categories/blouse.png",
    backgroundColor: "#F0FFED",
    slug: "pullover",
  },
  {
    id: 3,
    name: "دامن",
    image: "/images/categories/skirt.png",
    backgroundColor: "#FFF0ED",
    slug: "skirt",
  },
  {
    id: 4,
    name: "پیرهن",
    image: "/images/categories/dress.png",
    backgroundColor: "#EDF6FF",
    slug: "shirt",
  },
  {
    id: 5,
    name: "شلوار",
    image: "/images/categories/pants.png",
    backgroundColor: "#F0FFF7",
    slug: "pants",
  },
  {
    id: 6,
    name: "شال و روسری",
    image: "/images/categories/scarf.png",
    backgroundColor: "#FFF8E7",
    slug: "shawls-and-scarves",
  },
  {
    id: 7,
    name: "هودی",
    image: "/images/categories/hoodie.png",
    backgroundColor: "#FFF8E7",
    slug: "hoodie-and-dores",
  },
];

export default categories;

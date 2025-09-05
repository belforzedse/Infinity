import Image from "next/image";
import Link from "next/link";
import { categories } from "@/constants/categories";

export default function CategoriesPage() {
  return (
    <div className="mx-auto mt-5 max-w-screen-xl px-4 pb-8 md:mt-8 md:px-8 md:pb-16 lg:px-16">
      <div className="grid grid-cols-3 gap-4 md:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/plp?category=${category.slug}`}
            className="flex flex-col items-center gap-2"
          >
            <div
              className="relative h-24 w-24 rounded-full"
              style={{ backgroundColor: category.backgroundColor }}
            >
              <Image
                src={category.image}
                alt={category.name}
                fill
                className="p-4 object-contain"
                sizes="96px"
              />
            </div>
            <span className="text-sm">{category.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

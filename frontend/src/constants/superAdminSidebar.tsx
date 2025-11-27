import type { ReactNode } from "react";
import ProductIcon from "@/components/SuperAdmin/Layout/Icons/ProductIcon";
import OrdersIcon from "@/components/SuperAdmin/Layout/Icons/OrdersIcon";
import UsersIcon from "@/components/SuperAdmin/Layout/Icons/UsersIcon";
import CartIcon from "@/components/SuperAdmin/Layout/Icons/CartIcon";
import ShippingIcon from "@/components/SuperAdmin/Layout/Icons/ShippingIcon";
import PercentIcon from "@/components/SuperAdmin/Layout/Icons/PercentIcon";
import DashboardIcon from "@/components/SuperAdmin/Layout/Icons/DashboardIcon";
import PaymentIcon from "@/components/SuperAdmin/Layout/Icons/PaymentIcon";
import BlogIcon from "@/components/SuperAdmin/Layout/Icons/BlogIcon";
import {
  //FiLayout,
  FiMenu,
  FiUsers,
  FiLayers,
  FiBell,
  FiBarChart,
  FiDatabase,
} from "react-icons/fi";

// Create a styled layout/menu icons (unused definitions removed)
const RarMenu = () => <FiMenu className="h-5 w-5 text-pink-500" stroke="#EC4899" />;
//Create a styled club icon
const _MultiUsersIcon = () => <FiUsers className="h-5 w-5 text-pink-500" stroke="#EC4899" />;

//Create a styled Pages icon
const _PagesIcon = () => <FiLayers className="h-5 w-5 text-pink-500" stroke="#EC4899" />;

const BellIcon = () => <FiBell className="h-5 w-5 text-pink-500" stroke="#EC4899" />;
const ChartIcon = () => <FiBarChart className="h-5 w-5 text-pink-500" stroke="#EC4899" />;

const _CacheIcon = () => <FiDatabase className="h-5 w-5 text-pink-500" stroke="#EC4899" />;

type SidebarChild = {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
};

export type SidebarItem = {
  id: string;
  label: string;
  href?: string;
  icon: ReactNode;
  children: SidebarChild[];
};

const superAdminSidebar: SidebarItem[] = [
  {
    id: "dashboard",
    label: "پیشخوان",
    href: "/super-admin/",
    icon: <DashboardIcon />,
    children: [],
  },
  {
    id: "manage-products",
    label: "مدیریت محصولات",
    href: "",
    icon: <ProductIcon />,

    children: [
      // {
      //   id: "product-attributes",
      //   label: "ویژگی ها",
      //   href: "/super-admin/products/attributes",
      // },
      {
        id: "productس",
        label: " محصولات",
        href: "/super-admin/products",
      },
      {
        id: "product-categories",
        label: "دسته بندی ها",
        href: "/super-admin/products/categories",
      },
      // {
      //   id: "product-tags",
      //   label: "برچسب ها",
      //   href: "/super-admin/products/tags",
      // },
      {
        id: "product-comments",
        label: "مدیریت نظرات",
        href: "/super-admin/products/comments",
      },
      {
        id: "product-colors",
        label: "مدیریت رنگ‌ها",
        href: "/super-admin/products/colors",
      },
    ],
  },
  {
    id: "blog",
    label: "مدیریت وبلاگ",
    href: "",
    icon: <BlogIcon />,
    children: [
      {
        id: "blog-dashboard",
        label: "داشبورد وبلاگ",
        href: "/super-admin/blog",
      },
      {
        id: "blog-posts",
        label: "مدیریت پست‌ها",
        href: "/super-admin/blog/posts",
      },
      {
        id: "blog-categories",
        label: "دسته‌بندی‌ها",
        href: "/super-admin/blog/categories",
      },
      {
        id: "blog-tags",
        label: "برچسب‌ها",
        href: "/super-admin/blog/tags",
      },
      {
        id: "blog-authors",
        label: "نویسندگان",
        href: "/super-admin/blog/authors",
      },
      {
        id: "blog-comments",
        label: "مدیریت نظرات",
        href: "/super-admin/blog/comments",
      },
    ],
  },
  // {
  //   id: "customer-club",
  //   label: "باشگاه مشتریان",
  //   href: "/super-admin/customer-club",
  //   icon: <MultiUsersIcon />,
  //   children: [
  //     {
  //       id: "customer-club-actions",
  //       label: "عملیات ها",
  //       href: "/super-admin/customer-club/actions",
  //     },
  //     {
  //       id: "customer-club-items",
  //       label: "آیتم ها",
  //       href: "/super-admin/customer-club/items",
  //     },
  //   ],
  // },
  {
    id: "orders",
    label: "مدیریت سفارشات",
    href: "/super-admin/orders",
    icon: <OrdersIcon />,
    children: [],
  },
  {
    id: "carts",
    label: "سبد های خرید",
    href: "/super-admin/carts",
    icon: <CartIcon />,
    children: [],
  },
  // {
  //   id: "payment-methods",
  //   label: "روش های پرداخت",
  //   href: "/super-admin/payment-methods",
  //   icon: <PaymentIcon />,
  //   children: [],
  // },
  {
    id: "discounts",
    label: "مدیریت تخفیف ها",
    href: "",
    icon: <PercentIcon />,
    children: [
      {
        id: "coupons",
        label: "کدهای تخفیف",
        href: "/super-admin/coupons",
      },
      {
        id: "general-discounts",
        label: "تخفیفای عمومی",
        href: "/super-admin/general-discounts",
      },
    ],
  },
  {
    id: "shipping",
    label: "مدیریت حمل و نقل",
    href: "/super-admin/shipping",
    icon: <ShippingIcon />,
    children: [
      {
        id: "shipping-main",
        label: "حمل و نقل",
        href: "/super-admin/shipping",
      },
      {
        id: "shipping-provinces",
        label: "مدیریت استان ها",
        href: "/super-admin/shipping/provinces",
      },
      {
        id: "shipping-cities",
        label: "مدیریت شهرها",
        href: "/super-admin/shipping/provinces/1/cities",
      },
    ],
  },
  // {
  //   id: "pages-content",
  //   label: "صفحات و محتوا",
  //   href: "/super-admin/users",
  //   icon: <PagesIcon />,
  //   children: [],
  // },
  {
    id: "users",
    label: "مدیریت کاربران",
    href: "/super-admin/users",
    icon: <UsersIcon />,
    children: [],
  },
  {
    id: "reports",
    label: "گزارشات و تحلیل ها",
    icon: <ChartIcon />,
    children: [
      {
        id: "product-sales",
        label:" فروش هر محصول",
        href: "/super-admin/reports/product-sales",
      },
      {
        id: "admin-activity",
        label: "گزارش فعالیت پشتیبانان",
        href: "/super-admin/reports/admin-activity",
      },
    ],
  },
  // {
  //   id: "notifications",
  //   label: "نوتیفیکیشن ها",
  //   href: "/super-admin/notifications",
  //   icon: <BellIcon />,
  //   children: [],
  // },

  // {
  //   id: "cache",
  //   label: "حافظه پنهان",
  //   href: "/super-admin/cache",
  //   icon: <CacheIcon />,
  //   children: [],
  // },
  // {
  //   id: "navbaredit",
  //   label: "مدیریت منوی ناوبری",
  //   href: "/super-admin/navigation/edit",
  //   icon: <RarMenu />,
  //   children: [],
  // },
  // {
  //   id: "seo",
  //   label: "سئو",
  //   href: "/super-admin/SEO",
  //   icon: <FiGlobe className="h-5 w-5 text-pink-500" stroke="#EC4899" />,
  //   children: [],
  // },
];

const STORE_MANAGER_HIDDEN_PARENT_IDS = new Set(["users", "reports", "shipping", "settings"]);
const STORE_MANAGER_HIDDEN_CHILD_IDS = new Set(["product-comments", "admin-activity"]);

const cloneWithFilteredChildren = (item: SidebarItem) => {
  const filteredChildren = item.children
    .filter((child) => !STORE_MANAGER_HIDDEN_CHILD_IDS.has(child.id))
    .map((child) => ({ ...child }));

  return {
    ...item,
    children: filteredChildren,
  };
};

const normalizeRole = (roleName?: string | null) => (roleName ?? "").trim().toLowerCase();

export const getSidebarItemsForRole = (roleName?: string | null): SidebarItem[] => {
  const normalizedRole = normalizeRole(roleName);

  if (normalizedRole === "superadmin") {
    return superAdminSidebar;
  }

  return superAdminSidebar
    .filter((item) => !STORE_MANAGER_HIDDEN_PARENT_IDS.has(item.id))
    .map((item) => cloneWithFilteredChildren(item));
};

export default superAdminSidebar;

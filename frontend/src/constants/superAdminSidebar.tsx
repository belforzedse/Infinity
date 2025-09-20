import type { ReactNode } from "react";
import ProductIcon from "@/components/SuperAdmin/Layout/Icons/ProductIcon";
import OrdersIcon from "@/components/SuperAdmin/Layout/Icons/OrdersIcon";
import UsersIcon from "@/components/SuperAdmin/Layout/Icons/UsersIcon";
import CartIcon from "@/components/SuperAdmin/Layout/Icons/CartIcon";
import ShippingIcon from "@/components/SuperAdmin/Layout/Icons/ShippingIcon";
import PercentIcon from "@/components/SuperAdmin/Layout/Icons/PercentIcon";
import DashboardIcon from "@/components/SuperAdmin/Layout/Icons/DashboardIcon";
import PaymentIcon from "@/components/SuperAdmin/Layout/Icons/PaymentIcon";
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
const RarMenu = () => (
  <FiMenu className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);
//Create a styled club icon
const _MultiUsersIcon = () => (
  <FiUsers className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

//Create a styled Pages icon
const _PagesIcon = () => (
  <FiLayers className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

const BellIcon = () => (
  <FiBell className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);
const ChartIcon = () => (
  <FiBarChart className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

const _CacheIcon = () => (
  <FiDatabase className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

type SidebarChild = {
  id: string;
  label: string;
  href: string;
};

type SidebarItem = {
  id: string;
  label: string;
  href: string;
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
    id: "products",
    label: "مدیریت محصولات",
    href: "/super-admin/products",
    icon: <ProductIcon />,
    children: [],
    // children: [
    //   {
    //     id: "product-attributes",
    //     label: "ویژگی ها",
    //     href: "/super-admin/products/attributes",
    //   },
    //   {
    //     id: "product-categories",
    //     label: "دسته بندی ها",
    //     href: "/super-admin/products/categories",
    //   },
    //   {
    //     id: "product-tags",
    //     label: "برچسب ها",
    //     href: "/super-admin/products/tags",
    //   },
    //   {
    //     id: "product-comments",
    //     label: "مدیریت نظرات",
    //     href: "/super-admin/products/comments",
    //   },
    //   {
    //     id: "product-size-guide",
    //     label: "راهنمای اندازه",
    //     href: "/super-admin/products/size-guide",
    //   },
    // ],
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
  {
    id: "payment-methods",
    label: "روش های پرداخت",
    href: "/super-admin/payment-methods",
    icon: <PaymentIcon />,
    children: [],
  },
  {
    id: "discounts",
    label: "مدیریت تخفیف ها",
    href: "/super-admin/discounts",
    icon: <PercentIcon />,
    children: [
      {
        id: "coupons",
        label: "کدهای تخفیف",
        href: "/super-admin/coupons",
      },
      {
        id: "coupon-rules",
        label: "قوانین تخفیف",
        href: "/super-admin/coupons/rules",
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
    href: "/super-admin/reports",
    icon: <ChartIcon />,
    children: [],
  },
  {
    id: "notifications",
    label: "نوتیفیکیشن ها",
    href: "/super-admin/notifications",
    icon: <BellIcon />,
    children: [],
  },

  // {
  //   id: "cache",
  //   label: "حافظه پنهان",
  //   href: "/super-admin/cache",
  //   icon: <CacheIcon />,
  //   children: [],
  // },
  {
    id: "navbaredit",
    label: "مدیریت منوی ناوبری",
    href: "/super-admin/navigation/edit",
    icon: <RarMenu />,
    children: [],
  },
  // {
  //   id: "seo",
  //   label: "سئو",
  //   href: "/super-admin/SEO",
  //   icon: <FiGlobe className="h-5 w-5 text-pink-500" stroke="#EC4899" />,
  //   children: [],
  // },
];

export default superAdminSidebar;

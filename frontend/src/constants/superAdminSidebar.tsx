import ProductIcon from "@/components/SuperAdmin/Layout/Icons/ProductIcon";
import OrdersIcon from "@/components/SuperAdmin/Layout/Icons/OrdersIcon";
import UsersIcon from "@/components/SuperAdmin/Layout/Icons/UsersIcon";
import CartIcon from "@/components/SuperAdmin/Layout/Icons/CartIcon";
import ShippingIcon from "@/components/SuperAdmin/Layout/Icons/ShippingIcon";
import PercentIcon from "@/components/SuperAdmin/Layout/Icons/PercentIcon";
import DashboardIcon from "../components/SuperAdmin/Layout/Icons/DashboardIcon";
import {
  FiLayout,
  FiMenu,
  FiUsers,
  FiCreditCard,
  FiLayers,
  FiBell,
  FiBarChart,
  FiDatabase,
  FiGlobe,
} from "react-icons/fi";

// Create a styled layout icon to match others
const LayoutIcon = () => (
  <FiLayout className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

// Create a styled menu/navigation icon
const NavigationIcon = () => (
  <FiMenu className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

//Create a styled club icon
const MultiUsersIcon = () => (
  <FiUsers className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

//Create a styled Pages icon
const PagesIcon = () => (
  <FiLayers className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

//Create a styles payment icon
const PaymentIcon = () => (
  <FiCreditCard className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

const BellIcon = () => (
  <FiBell className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);
const ChartIcon = () => (
  <FiBarChart className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

const ChacheIcon = () => (
  <FiDatabase className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

const superAdminSidebar = [
  {
    label: "پیشخوان",
    href: "/super-admin/",
    icon: <DashboardIcon />,
    children: [],
  },
  {
    label: "مدیریت محصولات",
    href: "/super-admin/products",
    icon: <ProductIcon />,
    children: [
      {
        label: "ویژگی ها",
        href: "/super-admin/products/comments",
      },
      {
        label: "دسته بندی ها",
        href: "/super-admin/products",
      },
      {
        label: "برچسب ها",
        href: "/super-admin/products",
      },
      {
        label: "مدیریت نظرات",
        href: "/super-admin/products",
      },
      {
        label: "راهنمای اندازه",
        href: "/super-admin/products",
      },
    ],
  },
  {
    label: "باشگاه مشتریان",
    href: "/super-admin/orders",
    icon: <MultiUsersIcon />,
    children: [
      {
        label: "عملیات ها",
        href: "/super-admin/products/comments",
      },
      {
        label: "آیتم ها",
        href: "/super-admin/products",
      },
    ],
  },
  {
    label: "مدیریت سفارشات",
    href: "/super-admin/orders",
    icon: <OrdersIcon />,
    children: [],
  },
  {
    label: "سبد های خرید",
    href: "/super-admin/carts",
    icon: <CartIcon />,
    children: [],
  },
  {
    label: "روش های پرداخت",
    href: "/super-admin/payment-methods",
    icon: <PaymentIcon />,
    children: [],
  },
  {
    label: "مدیریت تخفیف ها",
    href: "/super-admin/coupons",
    icon: <PercentIcon />,
    children: [
      {
        label: "کدهای تخفیف",
        href: "/super-admin/coupons",
      },
      {
        label: "قوانین تخفیف",
        href: "/super-admin/coupons/rules",
      },
    ],
  },
  {
    label: "مدیریت حمل و نقل",
    href: "/super-admin/shipping",
    icon: <ShippingIcon />,
    children: [
      {
        label: "حمل و نقل",
        href: "/super-admin/shipping",
      },
      {
        label: "مدیریت استان ها",
        href: "/super-admin/shipping/provinces",
      },
      {
        label: "مدیریت شهرها",
        href: "/super-admin/shipping/provinces/1/cities",
      },
    ],
  },
  {
    label: "صفحات و محتوا",
    href: "/super-admin/users",
    icon: <PagesIcon />,
    children: [],
  },
  {
    label: "مدیریت کاربران",
    href: "/super-admin/users",
    icon: <UsersIcon />,
    children: [],
  },
  {
    label: "گزارشات و تحلیل ها",
    href: "/super-admin/reports",
    icon: <ChartIcon />,
    children: [],
  },
  {
    label: "نوتیفیکیشن ها",
    href: "/super-admin/notifications",
    icon: <BellIcon />,
    children: [],
  },

  {
    label: "حافظه پنهان",
    href: "/super-admin/navigation/edit",
    icon: <ChacheIcon />,
    children: [],
  },
  {
    label: "سئو",
    href: "/super-admin/navigation/edit",
    icon: <FiGlobe className="h-5 w-5 text-pink-500" stroke="#EC4899" />,
    children: [],
  },
];

export default superAdminSidebar;

import ProductIcon from "@/components/SuperAdmin/Layout/Icons/ProductIcon";
import DashboardIcon from "../components/SuperAdmin/Layout/Icons/DashboardIcon";
import OrdersIcon from "@/components/SuperAdmin/Layout/Icons/OrdersIcon";
import UsersIcon from "@/components/SuperAdmin/Layout/Icons/UsersIcon";
import CartIcon from "@/components/SuperAdmin/Layout/Icons/CartIcon";
import ShippingIcon from "@/components/SuperAdmin/Layout/Icons/ShippingIcon";
import PercentIcon from "@/components/SuperAdmin/Layout/Icons/PercentIcon";
import { FiLayout, FiMenu } from "react-icons/fi";

// Create a styled layout icon to match others
const LayoutIcon = () => (
  <FiLayout className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

// Create a styled menu/navigation icon
const NavigationIcon = () => (
  <FiMenu className="h-5 w-5 text-pink-500" stroke="#EC4899" />
);

export default [
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
        label: "مدیریت نظرات",
        href: "/super-admin/products/comments",
      },
      {
        label: "محصولات",
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
  // {
  //   label: "روش های پرداخت",
  //   href: "/super-admin/payment-methods",
  //   icon: <PaymentIcon />,
  //   children: [],
  // },
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
    label: "سبد های خرید",
    href: "/super-admin/carts",
    icon: <CartIcon />,
    children: [],
  },
  {
    label: "مدیریت کاربران",
    href: "/super-admin/users",
    icon: <UsersIcon />,
    children: [],
  },
  {
    label: "گزارش‌ها",
    href: "/super-admin/reports",
    icon: <DashboardIcon />,
    children: [
      { label: "مجموع نقدینگی", href: "/super-admin/reports/liquidity" },
      { label: "فروش محصولات", href: "/super-admin/reports/product-sales" },
      { label: "نقدینگی درگاه‌ها", href: "/super-admin/reports/gateway-liquidity" },
    ],
  },
  {
    label: "مدیریت فوتر",
    href: "/super-admin/footer/edit",
    icon: <LayoutIcon />,
    children: [],
  },
  {
    label: "مدیریت منوی ناوبری",
    href: "/super-admin/navigation/edit",
    icon: <NavigationIcon />,
    children: [],
  },
  // {
  //   label: "نوتیفیکیشن ها",
  //   href: "/super-admin/notifications",
  //   icon: <BellIcon />,
  //   children: [],
  // },
];

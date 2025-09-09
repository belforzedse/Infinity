export interface RouteInfo {
  name: string;
  path: string;
  description: string;
}

export const routes: RouteInfo[] = [
  {
    name: "Home",
    path: "/",
    description: "Main landing page",
  },

  // Super Admin Routes
  {
    name: "Super Admin Dashboard",
    path: "/super-admin",
    description: "Super administrator main dashboard",
  },
  {
    name: "Super Admin - Carts",
    path: "/super-admin/carts",
    description: "Manage shopping carts",
  },
  {
    name: "Super Admin - Orders",
    path: "/super-admin/orders",
    description: "Manage and monitor orders",
  },
  {
    name: "Super Admin - Products",
    path: "/super-admin/products",
    description: "Manage product catalog",
  },
  {
    name: "Super Admin - Products Comments",
    path: "/super-admin/products/comments",
    description: "Manage product comments",
  },
  {
    name: "Super Admin - Users",
    path: "/super-admin/users",
    description: "Manage user accounts",
  },
  {
    name: "Super Admin - Shipping",
    path: "/super-admin/shipping",
    description: "Manage shipping",
  },
  {
    name: "Super Admin - Shipping Areas",
    path: "/super-admin/shipping/areas",
    description: "Manage shipping areas",
  },
  {
    name: "Super Admin - Shipping Provinces",
    path: "/super-admin/shipping/provinces",
    description: "Manage shipping provinces",
  },
  {
    name: "Super Admin - Shipping Provinces Cities",
    path: "/super-admin/shipping/provinces/1/cities",
    description: "Manage shipping cities",
  },
  {
    name: "Super Admin - Payment Methods",
    path: "/super-admin/payment-methods",
    description: "Manage payment methods",
  },
  {
    name: "Super Admin - Coupons",
    path: "/super-admin/coupons",
    description: "Manage coupons",
  },
  {
    name: "Super Admin - Coupons Rules",
    path: "/super-admin/coupons/rules",
    description: "Manage coupons rules",
  },
  {
    name: "Super Admin - Discounts",
    path: "/super-admin/discounts",
    description: "Overview for discount management",
  },

  // Product Routes
  {
    name: "Product Listing (PLP)",
    path: "/plp",
    description: "Product Listing Page",
  },
  {
    name: "Categories",
    path: "/categories",
    description: "Browse product categories",
  },
  {
    name: "Product Details (PDP)",
    path: "/pdp/1",
    description: "Product Detail Page",
  },

  // User Routes
  {
    name: "Account Settings",
    path: "/account",
    description: "Manage account information",
  },
  {
    name: "Addresses",
    path: "/addresses",
    description: "Manage delivery addresses",
  },
  {
    name: "Favorites",
    path: "/favorites",
    description: "Saved and favorite items",
  },
  {
    name: "Orders",
    path: "/orders",
    description: "View and track orders",
  },
  {
    name: "Password Management",
    path: "/password",
    description: "Change password and security settings",
  },
  {
    name: "Privileges",
    path: "/privileges",
    description: "User privileges and permissions",
  },
  {
    name: "Wallet",
    path: "/wallet",
    description: "Manage wallet and transactions",
  },

  // Authentication Routes
  {
    name: "Authentication",
    path: "/auth",
    description: "Login and registration",
  },
  {
    name: "Forgot Password",
    path: "/auth/forgot-password",
    description: "Forgot password page",
  },
  {
    name: "Forgot Password Verify",
    path: "/auth/forgot-password/verify",
    description: "Forgot password verify page",
  },
  {
    name: "Login",
    path: "/auth/login",
    description: "Login page",
  },
  {
    name: "Login OTP",
    path: "/auth/login/otp",
    description: "Login OTP page",
  },
  {
    name: "Register",
    path: "/auth/register",
    description: "Register page",
  },
  {
    name: "Register Info",
    path: "/auth/register/info",
    description: "Register info page",
  },
];

export const getRoutes = () => {
  return routes;
};

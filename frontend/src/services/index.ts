/**
 * Services Index
 * Exports all service modules and the apiClient
 */

// Export apiClient from lib to avoid circular dependencies
export { apiClient } from "@/lib/api-client";

// Export services
export { default as AuthService } from "./auth";
export { default as UserService } from "./user";
export { default as CartService } from "./cart";
export { default as OrderService } from "./order";
export { default as ProductLikeService } from "./product/product-like";

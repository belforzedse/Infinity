# Cart API Integration Guide for Frontend

This document provides practical examples for integrating the custom cart APIs in frontend applications.

## Setup

### API Base URL and Auth

```javascript
const BASE_URL = "https://your-api-domain.com/api";
const headers = {
  Authorization: `Bearer ${userToken}`,
  "Content-Type": "application/json",
};
```

## Common Integration Patterns

### 1. Display User's Cart

```javascript
// Simple fetch of user's cart without stock checking
async function fetchUserCart() {
  try {
    const response = await fetch(`${BASE_URL}/carts/me`, {
      method: "GET",
      headers,
    });

    const cart = await response.json();

    // Render cart items
    renderCart(cart);

    return cart;
  } catch (error) {
    console.error("Error fetching cart:", error);
    showError("Failed to load your shopping cart");
  }
}

// Fetch cart with stock validation (use before checkout)
async function fetchCartWithStockCheck() {
  try {
    const response = await fetch(`${BASE_URL}/carts/check-stock`, {
      method: "GET",
      headers,
    });

    const data = await response.json();

    if (data.success) {
      // Render cart items from data.cart
      renderCart(data.cart);

      // If items were adjusted or removed, show notifications
      if (data.itemsAdjusted) {
        showAdjustmentNotifications(data.itemsAdjusted);
      }

      if (data.itemsRemoved) {
        showRemovalNotifications(data.itemsRemoved);
      }
    }

    return data;
  } catch (error) {
    console.error("Error fetching cart with stock check:", error);
    showError("Failed to validate your cart items");
  }
}
```

### 2. Add Product to Cart

```javascript
async function addToCart(productVariationId, count = 1) {
  try {
    const response = await fetch(`${BASE_URL}/carts/add-item`, {
      method: "POST",
      headers,
      body: JSON.stringify({ productVariationId, count }),
    });

    const data = await response.json();

    if (response.ok) {
      showSuccess("Product added to cart!");
      updateCartCounter();
    } else {
      showError(data.error || "Failed to add product to cart");
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    showError("Network error. Please try again.");
  }
}
```

### 3. Update Item Quantity

```javascript
async function updateCartItemQuantity(cartItemId, count) {
  try {
    const response = await fetch(`${BASE_URL}/carts/update-item`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ cartItemId, count }),
    });

    const data = await response.json();

    if (response.ok) {
      // Update UI with new quantity and total
      updateItemInUI(cartItemId, data);
    } else {
      showError(data.error || "Failed to update quantity");
      // Revert UI to previous quantity
      revertQuantityInUI(cartItemId);
    }
  } catch (error) {
    console.error("Error updating quantity:", error);
    showError("Network error. Please try again.");
    revertQuantityInUI(cartItemId);
  }
}
```

### 4. Remove Item from Cart

```javascript
async function removeCartItem(cartItemId) {
  try {
    const response = await fetch(
      `${BASE_URL}/carts/remove-item/${cartItemId}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (response.ok) {
      // Remove item from UI
      removeItemFromUI(cartItemId);
      updateCartTotals();
    } else {
      const data = await response.json();
      showError(data.error || "Failed to remove item");
    }
  } catch (error) {
    console.error("Error removing item:", error);
    showError("Network error. Please try again.");
  }
}
```

### 5. Checkout Process with Stock Check

```javascript
async function proceedToCheckout() {
  try {
    // First check stock and get the updated cart
    const stockResponse = await fetch(`${BASE_URL}/carts/check-stock`, {
      method: "GET",
      headers,
    });

    const stockData = await stockResponse.json();

    if (!stockData.valid) {
      // Show any stock issues to the user
      if (stockData.itemsAdjusted) {
        showAdjustmentWarning(stockData.itemsAdjusted);
      }

      if (stockData.itemsRemoved) {
        showRemovalWarning(stockData.itemsRemoved);
      }

      // Update cart UI with adjusted items
      updateCartUI(stockData.cart);

      if (stockData.cartIsEmpty) {
        showError("Your cart is empty. Please add products before checkout.");
        return false;
      }
    }

    // If everything is valid or user confirms the changes, proceed to shipping/payment page
    return true;
  } catch (error) {
    console.error("Error checking stock:", error);
    showError("Network error. Please try again.");
    return false;
  }
}
```

### 6. Complete Order Creation

```javascript
async function finalizeOrder(shippingInfo) {
  try {
    const response = await fetch(`${BASE_URL}/carts/finalize`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        shipping: shippingInfo.shippingId,
        shippingCost: shippingInfo.cost,
        description: shippingInfo.specialInstructions,
        note: shippingInfo.notes,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Order created successfully
      showSuccess("Order created successfully!");
      // Redirect to order confirmation page
      navigateToOrderConfirmation(data.orderId);
    } else {
      // Handle errors
      if (data.itemsAdjusted || data.itemsRemoved) {
        // Stock changes occurred during finalization
        showStockChangeWarning(data);
        updateCartUI(data.cart);
      } else {
        showError(data.error || "Failed to create order");
      }
    }
  } catch (error) {
    console.error("Error finalizing order:", error);
    showError("Network error. Please try again.");
  }
}
```

## UI Components and Helper Functions

### Stock Issue Notifications

```javascript
function showAdjustmentNotifications(adjustments) {
  adjustments.forEach((item) => {
    // Show a toast or notification for each adjustment
    showToast(
      "warning",
      `Quantity for item ${getProductName(
        item.productVariationId
      )} adjusted from ${item.requested} to ${
        item.newQuantity
      } due to limited stock.`
    );
  });
}

function showRemovalNotifications(removals) {
  removals.forEach((item) => {
    // Show a toast or notification for each removed item
    showToast(
      "error",
      `${getProductName(
        item.productVariationId
      )} has been removed from your cart because it's out of stock.`
    );
  });
}
```

### Update Cart UI

```javascript
function updateCartUI(cart) {
  // Clear current cart UI
  cartContainer.innerHTML = "";

  // Handle empty cart
  if (!cart.cart_items || cart.cart_items.length === 0) {
    showEmptyCartMessage();
    return;
  }

  // Render each cart item
  cart.cart_items.forEach((item) => {
    renderCartItem(item);
  });

  // Update totals
  updateCartTotals(cart);
}
```

## Best Practices

1. **Always check stock before checkout**: Call the check-stock endpoint before proceeding to checkout to ensure all items are available.

2. **Handle adjustments gracefully**: When quantities are adjusted or items are removed due to stock issues, clearly explain these changes to the user.

3. **Optimistic UI updates**: Update the UI immediately after a user action but be prepared to revert changes if the API returns an error.

4. **Show detailed errors**: When an error occurs, show the specific message returned by the API rather than a generic error.

5. **Cache cart data**: Store cart data in localStorage or a state management system to improve performance, but always validate with a fresh API call before critical operations.

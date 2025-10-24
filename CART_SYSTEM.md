# Cart System Documentation

## Overview
The cart system uses React Context API for global state management, with localStorage persistence to maintain cart data across sessions.

## Architecture

### CartContext (`context/CartContext.tsx`)
- Global state management for cart
- Provides cart operations: `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`
- Automatically calculates: `cartCount`, `subtotal`, `tax`, `shipping`, `total`
- Persists cart data to localStorage

### Key Features

1. **Dynamic Cart Count**
   - Updates in real-time in navbar
   - Stored in CartContext

2. **Dynamic Calculations**
   - Subtotal: Sum of (price × quantity) for all items
   - Tax: 10% of subtotal
   - Shipping: $15.00 (free if cart is empty)
   - Total: subtotal + tax + shipping

3. **LocalStorage Persistence**
   - Cart data saved automatically
   - Restored on page reload

## Usage

### Adding Items to Cart
```typescript
const { addToCart } = useCart();

addToCart({
  id: '1',
  name: 'Product Name',
  price: 99.99,
  image: '/product.jpg',
  category: 'Electronics',
  quantity: 1, // Optional, defaults to 1
});
```

### Reading Cart Data
```typescript
const { cartItems, cartCount, subtotal, tax, shipping, total } = useCart();
```

### Updating Quantity
```typescript
const { updateQuantity } = useCart();
updateQuantity('product-id', 2); // Set quantity to 2
```

### Removing Items
```typescript
const { removeFromCart } = useCart();
removeFromCart('product-id');
```

## Components Using Cart

1. **Navbar** - Displays cart count badge
2. **ProductCard** - Adds items to cart
3. **Product Detail Page** - Adds items to cart
4. **Cart Page** - Displays all cart items with totals
5. **CartSummary** - Shows cart calculations

## Data Flow

```
User clicks "Add to Cart"
    ↓
ProductCard/ProductDetailPage calls addToCart()
    ↓
CartContext updates state
    ↓
localStorage updated
    ↓
Navbar badge updates (cartCount)
    ↓
Cart page shows new item
    ↓
Totals recalculated automatically
```

## Testing

1. **Add to Cart**: Click "Add to Cart" on any product
2. **View Count**: Check navbar badge (top-right)
3. **View Cart**: Navigate to /cart
4. **Update Quantity**: Use +/- buttons
5. **Remove Item**: Click remove button
6. **Persistence**: Reload page, cart should persist


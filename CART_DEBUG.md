# Cart System Debug Guide

## Quick Test

1. **Clear localStorage first:**
   - Open browser console (F12)
   - Run: `localStorage.clear()`
   - Refresh page

2. **Test Add to Cart:**
   - Go to any product
   - Click "Add to Cart"
   - Should see toast: "🛒 Product added to cart!" with "View Cart" button
   - Check navbar badge - should show "1"
   - Check console: `localStorage.getItem('cart')` should show the item

3. **Navigate to Cart:**
   - Click "View Cart" button in toast OR
   - Click cart icon in navbar
   - Should see your item with correct details

## Debug Steps

### Step 1: Check localStorage
```javascript
// In browser console
localStorage.getItem('cart')
```
Expected output: 
```json
[{"id":"1","name":"Product Name","price":299.99,"quantity":1,"image":"...","category":"..."}]
```

### Step 2: Check Cart Context
```javascript
// In browser console (while on any page)
// This should be populated after adding items
```

### Step 3: Force Add Item (Testing)
```javascript
// In browser console
localStorage.setItem('cart', JSON.stringify([{
  id: 'test-1',
  name: 'Test Product',
  price: 99.99,
  quantity: 1,
  image: '/placeholder.jpg',
  category: 'Test'
}]));
// Then refresh page and go to cart
```

## Common Issues & Fixes

### Issue 1: "Cart is empty" after adding
**Cause:** Cart context not initialized before page renders
**Fix:** ✅ Added `isInitialized` check - wait for localStorage to load

### Issue 2: Badge shows 0 after adding
**Cause:** Race condition - redirect happens before state updates
**Fix:** ✅ Removed auto-redirect, added "View Cart" button in toast

### Issue 3: Items disappear on refresh
**Cause:** localStorage not saving properly
**Fix:** ✅ Added immediate localStorage.setItem() in addToCart function

### Issue 4: Duplicate items instead of quantity increment
**Cause:** Item ID comparison issue
**Fix:** ✅ Check that product IDs are strings and match exactly

## Verification Checklist

- [ ] Add item → Badge increments
- [ ] Add item → Toast appears with "View Cart" button
- [ ] Click "View Cart" → Redirects to /cart
- [ ] Cart page shows item
- [ ] Totals calculated correctly
- [ ] Refresh page → Cart persists
- [ ] Remove item → Badge decrements
- [ ] Add same item twice → Quantity increases (not duplicate)

## Still Having Issues?

1. **Clear browser cache completely**
2. **Check browser console for errors**
3. **Verify you're signed in (required for add to cart)**
4. **Try incognito/private mode**
5. **Check if JavaScript is enabled**

## Manual Test Script

```javascript
// Run this in browser console to test cart system
const testCart = () => {
  console.log('=== CART SYSTEM TEST ===');
  
  // 1. Check localStorage
  const cartData = localStorage.getItem('cart');
  console.log('1. LocalStorage cart:', cartData);
  
  // 2. Parse cart
  try {
    const cart = JSON.parse(cartData || '[]');
    console.log('2. Parsed cart:', cart);
    console.log('3. Cart item count:', cart.length);
    console.log('4. Total items:', cart.reduce((sum, item) => sum + item.quantity, 0));
  } catch (e) {
    console.error('Error parsing cart:', e);
  }
  
  console.log('=== TEST COMPLETE ===');
};

testCart();
```


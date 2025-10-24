# Cart Not Adding Items - Troubleshooting Guide

## Quick Fix Steps

### Step 1: Clear Everything and Restart
```bash
1. Open browser console (F12)
2. Run: localStorage.clear()
3. Close ALL browser tabs with your site
4. Restart the dev server (Ctrl+C, then npm run dev)
5. Open a fresh browser tab to http://localhost:3000
```

### Step 2: Test with Debug Page
```bash
1. Go to: http://localhost:3000/test-cart
2. Make sure you're signed in
3. Click "Add Test Item to Cart"
4. Watch the console for logs
5. Check if:
   - "Cart Count" increases
   - Item appears in "Cart Contents"
   - Badge in navbar updates
```

### Step 3: Check Console Logs
When you click "Add to Cart", you should see these logs in order:

```
✅ Adding to cart: {id: "1", name: "...", price: 299.99, ...}
✅ CartContext: addToCart called with: {id: "1", ...}
✅ CartContext: Current cart items: []
✅ CartContext: prevItems: []
✅ CartContext: New item, adding to cart
✅ CartContext: Updated items: [{...}]
✅ CartContext: Saved to localStorage
✅ Successfully added to cart
```

## Common Issues

### Issue 1: "useCart must be used within a CartProvider"
**Solution:** The app is not properly wrapped with CartProvider.
- Check `app/layout.tsx`
- Ensure `<CartProvider>` wraps the entire app
- Restart dev server

### Issue 2: Console shows no logs at all
**Solution:** Button click not working
- Make sure you're signed in (required for add to cart)
- Check if button is disabled
- Try clicking the button on the test page instead

### Issue 3: Logs appear but cart stays empty
**Solution:** localStorage might be blocked
- Check browser settings - allow localStorage
- Try incognito/private mode
- Check if browser has storage restrictions

### Issue 4: Error: "localStorage is not defined"
**Solution:** Server-side rendering issue
- This should not happen as we check `isInitialized`
- Clear browser cache and restart

### Issue 5: Cart count shows 0 even after adding
**Solution:** State not updating
- Check React DevTools (Components tab)
- Look for CartProvider
- Verify cartItems array has items

## Manual Testing

### Test 1: Direct localStorage Test
```javascript
// In browser console
localStorage.setItem('cart', JSON.stringify([{
  id: '1',
  name: 'Test Item',
  price: 99.99,
  quantity: 1,
  image: '/test.jpg'
}]));

// Then refresh page
// Badge should show "1"
```

### Test 2: Check CartProvider State
```javascript
// In browser console, paste this:
const checkCart = () => {
  const cart = localStorage.getItem('cart');
  console.log('Raw localStorage:', cart);
  
  if (cart) {
    const parsed = JSON.parse(cart);
    console.log('Parsed cart:', parsed);
    console.log('Item count:', parsed.reduce((sum, item) => sum + item.quantity, 0));
  } else {
    console.log('No cart in localStorage');
  }
};

checkCart();
```

## Expected Behavior

### When You Click "Add to Cart":

1. **If NOT signed in:**
   - Toast: "🔒 Please sign in to add items to cart"
   - Redirects to sign-in page

2. **If signed in:**
   - Console logs appear (see Step 3 above)
   - Toast: "🛒 [Product] added to cart!"
   - Navbar badge increments (0 → 1, 1 → 2, etc.)
   - localStorage gets updated
   - No redirect (you stay on current page)

3. **Navigate to cart page manually:**
   - Click cart icon in navbar
   - Should see your items
   - Totals calculated correctly

## Still Not Working?

### Gather Debug Info

1. **Check all console logs**
   - Any red errors?
   - What's the last successful log?

2. **Check localStorage**
   ```javascript
   console.log(localStorage.getItem('cart'));
   ```

3. **Check if you're signed in**
   ```javascript
   // Should show your user info
   console.log('User:', document.cookie);
   ```

4. **Take screenshots of:**
   - Browser console with all logs
   - Network tab (any failed requests?)
   - React DevTools (CartProvider state)

5. **Share:**
   - What browser and version?
   - Any browser extensions blocking JavaScript?
   - Any console errors (red text)?

## Clean Slate Reset

If nothing works, do a complete reset:

```bash
# 1. Clear browser
localStorage.clear()
sessionStorage.clear()
# Clear all cookies for localhost

# 2. Stop dev server (Ctrl+C)

# 3. Clear Next.js cache
rm -rf .next
# On Windows: rmdir /s /q .next

# 4. Restart
npm run dev

# 5. Open in incognito mode
# Go to http://localhost:3000
# Sign in fresh
# Try adding to cart
```

## Developer Notes

The cart system uses:
- **CartContext** (`context/CartContext.tsx`) - Global state
- **localStorage** - Persistence
- **React hooks** - State management
- **Clerk** - Authentication check

All console logs are enabled for debugging. Once working, you can remove them by searching for `console.log` in:
- `context/CartContext.tsx`
- `components/products/ProductCard.tsx`
- `app/products/[id]/page.tsx`


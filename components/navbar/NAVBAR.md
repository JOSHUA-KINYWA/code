# Navbar Components Documentation

Complete, feature-rich navbar system with 8 modular components.

## Components Overview

```
components/navbar/
├── Navbar.tsx          # Main navbar component
├── Logo.tsx            # Brand logo
├── CartButton.tsx      # Shopping cart button with badge
├── DarkMode.tsx        # Dark mode toggle
├── NavSearch.tsx       # Expandable search bar
├── UserIcon.tsx        # User profile dropdown
├── LinksDropdown.tsx   # Dropdown menu for links
├── SignOutLink.tsx     # Sign out button
└── index.ts            # Exports
```

## Components

### 1. Navbar (Main Component)

The main navbar component that combines all other components.

**Features:**
- Responsive design with mobile menu
- Desktop and mobile layouts
- Active link highlighting
- Authenticated/guest state handling
- Dark mode support

**Usage:**
```tsx
import Navbar from '@/components/navbar/Navbar';

export default function Layout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}
```

**Configuration:**
```tsx
// In Navbar.tsx, modify these values:
const isAuthenticated = false; // Change based on your auth system
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
};
```

---

### 2. Logo

Brand logo with icon and text.

**Features:**
- Gradient background icon
- Shopping bag icon
- Links to home page
- Dark mode support

**Usage:**
```tsx
import Logo from '@/components/navbar/Logo';

<Logo />
```

**Customization:**
```tsx
// Change the text
<span className="text-2xl font-bold">YourBrand</span>

// Change the icon
<svg>...</svg> // Replace with your icon
```

---

### 3. CartButton

Shopping cart button with item count badge.

**Props:**
```tsx
interface CartButtonProps {
  itemCount?: number; // Number of items in cart
}
```

**Features:**
- Animated badge with item count
- Shows "9+" for 10+ items
- Pulse animation when items present
- Dark mode support

**Usage:**
```tsx
import CartButton from '@/components/navbar/CartButton';

<CartButton itemCount={3} />
```

---

### 4. DarkMode

Toggle button for dark/light mode.

**Features:**
- Persists preference to localStorage
- System preference detection
- Smooth icon transitions
- Adds/removes 'dark' class to document

**Usage:**
```tsx
import DarkMode from '@/components/navbar/DarkMode';

<DarkMode />
```

**Setup Required:**
Add to your `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  // ...
}
```

---

### 5. NavSearch

Expandable search bar with animation.

**Features:**
- Expands on click/focus
- Collapses when empty and blurred
- Redirects to products page with query
- Dark mode support

**Usage:**
```tsx
import NavSearch from '@/components/navbar/NavSearch';

<NavSearch />
```

**Behavior:**
- On submit: Redirects to `/products?search=query`
- Clears after search
- Auto-collapses when empty

---

### 6. UserIcon

User profile icon with dropdown menu.

**Props:**
```tsx
interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface UserIconProps {
  user?: User | null;
}
```

**Features:**
- Shows login link if not authenticated
- Avatar or initial circle when authenticated
- Dropdown with quick links
- Click outside to close
- Dark mode support

**Usage:**
```tsx
import UserIcon from '@/components/navbar/UserIcon';

// Guest
<UserIcon user={null} />

// Authenticated
<UserIcon user={{
  name: 'John Doe',
  email: 'john@example.com',
  avatar: '/avatar.jpg'
}} />
```

**Menu Links:**
- My Orders
- Favorites
- My Reviews
- Settings

---

### 7. LinksDropdown

Reusable dropdown menu for navigation links.

**Props:**
```tsx
interface NavLink {
  name: string;
  href: string;
  icon?: React.ReactNode;
}

interface LinksDropdownProps {
  links: NavLink[];
  title?: string;
}
```

**Features:**
- Active link highlighting
- Icon support
- Smooth animations
- Click outside to close
- Dark mode support

**Usage:**
```tsx
import LinksDropdown from '@/components/navbar/LinksDropdown';

const shopLinks = [
  {
    name: 'All Products',
    href: '/products',
    icon: <svg>...</svg>
  },
  {
    name: 'Electronics',
    href: '/products?category=electronics',
  },
];

<LinksDropdown links={shopLinks} title="Shop" />
```

---

### 8. SignOutLink

Sign out button with redirect.

**Props:**
```tsx
interface SignOutLinkProps {
  onSignOut?: () => void; // Custom sign out handler
}
```

**Features:**
- Custom sign out callback
- Default behavior (clears localStorage)
- Redirects to home page
- Red styling for warning
- Dark mode support

**Usage:**
```tsx
import SignOutLink from '@/components/navbar/SignOutLink';

// Default behavior
<SignOutLink />

// Custom handler
<SignOutLink onSignOut={async () => {
  await myAuthProvider.signOut();
}} />
```

---

## Complete Example

### Basic Setup

```tsx
// app/layout.tsx
import Navbar from '@/components/navbar/Navbar';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
```

### Custom Navbar

Build your own navbar using individual components:

```tsx
'use client';

import {
  Logo,
  CartButton,
  DarkMode,
  NavSearch,
  UserIcon,
  LinksDropdown,
} from '@/components/navbar';

export default function CustomNavbar() {
  const user = { name: 'John', email: 'john@example.com' };
  const links = [
    { name: 'Products', href: '/products' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          
          <div className="flex items-center space-x-8">
            <LinksDropdown links={links} title="Menu" />
          </div>

          <div className="flex items-center space-x-4">
            <NavSearch />
            <DarkMode />
            <CartButton itemCount={5} />
            <UserIcon user={user} />
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## Styling & Customization

### Colors

All components use Tailwind's color system:
- Primary: `blue-600`
- Dark mode: `gray-800`, `gray-900`
- Text: `gray-700`, `gray-900`

To change:
```tsx
// Replace blue-600 with your color
className="bg-blue-600" → className="bg-purple-600"
```

### Dark Mode

Components automatically support dark mode using Tailwind's `dark:` variant.

**Setup:**
1. Add to `tailwind.config.js`:
```js
module.exports = {
  darkMode: 'class',
  // ...
}
```

2. The DarkMode component handles the rest!

### Responsive Breakpoints

- Mobile: < 768px (md)
- Desktop: ≥ 768px

Mobile menu activates below `md` breakpoint.

---

## Integration with Auth

### NextAuth.js Example

```tsx
import { useSession } from 'next-auth/react';
import Navbar from '@/components/navbar/Navbar';

export default function MyNavbar() {
  const { data: session } = useSession();
  
  return <Navbar user={session?.user} />;
}
```

### Custom Auth Example

```tsx
import Navbar from '@/components/navbar/Navbar';

export default function MyNavbar() {
  // Connect to your custom auth system
  const user = yourAuthSystem.getUser();
  
  return <Navbar user={user} />;
}
```

---

## Features Summary

✅ Fully responsive (mobile + desktop)  
✅ Dark mode support  
✅ Authenticated/guest states  
✅ Shopping cart with badge  
✅ Expandable search  
✅ User dropdown menu  
✅ Dropdown navigation menus  
✅ Active link highlighting  
✅ Click outside to close  
✅ Smooth animations  
✅ TypeScript support  
✅ Modular architecture  

---

## Best Practices

1. **Import the main Navbar component for standard usage:**
   ```tsx
   import Navbar from '@/components/navbar/Navbar';
   ```

2. **Use individual components for custom layouts:**
   ```tsx
   import { Logo, CartButton, DarkMode } from '@/components/navbar';
   ```

3. **Customize the main Navbar component** by editing `Navbar.tsx`

4. **Connect to your auth system** by modifying the `isAuthenticated` check

5. **Update cart count** from your cart state/context

---

## Troubleshooting

### Dark mode not working?
- Ensure `darkMode: 'class'` in `tailwind.config.js`
- Check if 'dark' class is added to `<html>` element

### Links not highlighting?
- Verify `usePathname()` returns correct path
- Check `isActive()` function logic

### Dropdowns not closing?
- Ensure click outside handlers are working
- Check z-index conflicts

### Search not redirecting?
- Verify Next.js router is imported correctly
- Check `/products` page exists

---

## Next Steps

1. Connect to real authentication system
2. Connect cart count to state management
3. Implement real search functionality
4. Add analytics tracking
5. Customize colors and styling
6. Add more dropdown menus as needed

Enjoy your fully-featured navbar! 🎉

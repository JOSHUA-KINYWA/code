# Navbar Structure

## Visual Component Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                          NAVBAR                                  │
│  ┌──────────┬────────────────────────────┬──────────────────┐  │
│  │          │                            │                  │  │
│  │  Logo    │     Navigation Links       │   Right Icons    │  │
│  │          │                            │                  │  │
│  │  [Shop]  │  [Home] [Shop▾] [About]   │  [🔍][☀][🛒][👤]│  │
│  │          │         └─Dropdown         │                  │  │
│  │          │          ├─Products        │                  │  │
│  │          │          ├─Electronics     │                  │  │
│  │          │          ├─Audio           │                  │  │
│  │          │          └─Wearables       │                  │  │
│  └──────────┴────────────────────────────┴──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Component Breakdown

### Desktop View
```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  [Home] [Shop▾] [About]     [Search] [Dark] [Cart] [User] │
└────────────────────────────────────────────────────────────┘
```

### Mobile View
```
┌──────────────────────────────────┐
│  [Logo]              [Search] [≡] │
├──────────────────────────────────┤
│  [Home]                          │
│  [Products]                      │
│  [About]                         │
│  [Favorites]                     │
│  [Orders]                        │
│  [Sign Out]                      │
└──────────────────────────────────┘
```

## Component Files

1. **Navbar.tsx** (Main Component)
   - Orchestrates all components
   - Handles mobile menu
   - Manages authentication state

2. **Logo.tsx**
   - Brand logo with icon
   - Links to home page

3. **CartButton.tsx**
   - Cart icon with badge
   - Shows item count
   - Animated badge

4. **DarkMode.tsx**
   - Toggle dark/light mode
   - Persists to localStorage
   - Smooth icon transition

5. **NavSearch.tsx**
   - Expandable search bar
   - Search functionality
   - Animated expand/collapse

6. **UserIcon.tsx**
   - User profile dropdown
   - Shows avatar or initial
   - Quick links menu

7. **LinksDropdown.tsx**
   - Reusable dropdown menu
   - Active state highlighting
   - Icon support

8. **SignOutLink.tsx**
   - Sign out button
   - Custom callback support
   - Redirects after sign out

## Data Flow

```
┌─────────────┐
│   Auth      │
│   Provider  │
└──────┬──────┘
       │
       ↓
┌─────────────────┐
│    Navbar       │
│  (Main)         │
├─────────────────┤
│ • user          │
│ • isAuth        │
│ • cartCount     │
└────┬───┬───┬────┘
     │   │   │
     ↓   ↓   ↓
  ┌────┬────┬────┐
  │Logo│Cart│User│
  └────┴────┴────┘
```

## State Management

### Local State (within Navbar)
- `isMobileMenuOpen` - Mobile menu visibility
- `isUserMenuOpen` - User dropdown visibility

### Component State
- **DarkMode**: `isDark` + localStorage
- **NavSearch**: `searchQuery` + `isExpanded`
- **UserIcon**: `isOpen` (dropdown)
- **LinksDropdown**: `isOpen` (dropdown)

## Props Flow

```
App/Layout
    │
    └─→ Navbar
         ├─→ Logo (no props)
         ├─→ CartButton (itemCount: number)
         ├─→ DarkMode (no props)
         ├─→ NavSearch (no props)
         ├─→ UserIcon (user: User | null)
         ├─→ LinksDropdown (links: NavLink[], title: string)
         └─→ SignOutLink (onSignOut?: function)
```

## Integration Points

### Authentication
```tsx
// Replace in Navbar.tsx:
const isAuthenticated = false; // ← Connect to auth
const user = isAuthenticated ? mockUser : null;
```

### Shopping Cart
```tsx
// Replace in Navbar.tsx:
<CartButton itemCount={3} /> // ← Connect to cart state
```

### Search
```tsx
// In NavSearch.tsx:
router.push(`/products?search=${query}`); // ← Customize route
```

## File Sizes

- Navbar.tsx: ~10KB (largest, main component)
- UserIcon.tsx: ~7KB (dropdown logic)
- NAVBAR.md: ~9KB (documentation)
- Others: ~1-3KB each

Total: ~40KB of code + docs

## Features Matrix

| Component      | Dark Mode | Responsive | Dropdown | Animation | Auth |
|----------------|-----------|------------|----------|-----------|------|
| Navbar         | ✅        | ✅         | ✅       | ✅        | ✅   |
| Logo           | ✅        | ✅         | ❌       | ❌        | ❌   |
| CartButton     | ✅        | ✅         | ❌       | ✅        | ❌   |
| DarkMode       | ✅        | ✅         | ❌       | ✅        | ❌   |
| NavSearch      | ✅        | ✅         | ❌       | ✅        | ❌   |
| UserIcon       | ✅        | ✅         | ✅       | ✅        | ✅   |
| LinksDropdown  | ✅        | ✅         | ✅       | ✅        | ❌   |
| SignOutLink    | ✅        | ✅         | ❌       | ❌        | ✅   |

## Usage Quick Reference

### Basic
```tsx
import Navbar from '@/components/navbar/Navbar';
<Navbar />
```

### Custom
```tsx
import { Logo, CartButton, UserIcon } from '@/components/navbar';
<nav>
  <Logo />
  <CartButton itemCount={5} />
  <UserIcon user={user} />
</nav>
```

### With Auth
```tsx
const { user } = useAuth();
<Navbar user={user} />
```

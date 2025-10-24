# 🚀 Supabase + Next.js Complete Setup Guide

## ✅ What's Been Installed:

- ✅ `@supabase/supabase-js` - Supabase JavaScript client
- ✅ `@supabase/ssr` - Server-Side Rendering utilities for Next.js
- ✅ Supabase utilities created for Server, Client, and Middleware
- ✅ Middleware configured for auth session management
- ✅ Environment variables configured

---

## 📁 File Structure Created:

```
utils/
  supabase/
    ├── server.ts      # For Server Components & Route Handlers
    ├── client.ts      # For Client Components
    └── middleware.ts  # For Middleware (session refresh)
middleware.ts          # Next.js middleware config
.env                   # Environment variables
```

---

## 🎯 How to Use Supabase in Your App:

### 1. **Server Components** (app/page.tsx, etc.)

```typescript
import { createClient } from '@/utils/supabase/server';

export default async function Page() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // Query database
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('isActive', true);

  return (
    <div>
      <h1>Welcome {user?.email}</h1>
      {products?.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

### 2. **Client Components** (interactive components)

```typescript
'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';

export default function ClientComponent() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('products')
        .select('*');
      setProducts(data || []);
    }
    fetchProducts();
  }, []);

  return <div>{/* Your UI */}</div>;
}
```

### 3. **API Route Handlers** (app/api/*/route.ts)

```typescript
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('products')
    .select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data });
}
```

---

## 🔐 Authentication Examples:

### Sign Up (Client Component)

```typescript
'use client';

import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';

export default function SignUpForm() {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'John Doe',
          role: 'user'
        }
      }
    });

    if (error) {
      console.error('Error signing up:', error.message);
    } else {
      console.log('User created:', data.user);
    }
  };

  return (
    <form onSubmit={handleSignUp}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password"
      />
      <button type="submit">Sign Up</button>
    </form>
  );
}
```

### Sign In (Client Component)

```typescript
const handleSignIn = async () => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123'
  });

  if (error) console.error('Error:', error.message);
};
```

### Sign Out (Client Component)

```typescript
const handleSignOut = async () => {
  await supabase.auth.signOut();
  router.push('/login');
};
```

### Get Current User (Server Component)

```typescript
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  return <div>Welcome {user.email}!</div>;
}
```

---

## 📊 Database Operations:

### Create/Insert

```typescript
const { data, error } = await supabase
  .from('products')
  .insert([
    { name: 'Product 1', price: 99.99, stock: 100 }
  ])
  .select();
```

### Read/Query

```typescript
// Get all
const { data } = await supabase.from('products').select('*');

// With filters
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('category', 'electronics')
  .gt('price', 50)
  .order('created_at', { ascending: false })
  .limit(10);

// With relationships
const { data } = await supabase
  .from('orders')
  .select(`
    *,
    user:users(*),
    items:order_items(*, product:products(*))
  `);
```

### Update

```typescript
const { data, error } = await supabase
  .from('products')
  .update({ stock: 50 })
  .eq('id', productId)
  .select();
```

### Delete

```typescript
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

---

## 🎨 Real-time Subscriptions:

```typescript
'use client';

useEffect(() => {
  const channel = supabase
    .channel('products-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'products'
      },
      (payload) => {
        console.log('Change received!', payload);
        // Update your UI
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 🗄️ Create Tables in Supabase:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to: https://supabase.com/dashboard/project/myeyhrkybdetxnavytdn/editor
2. Click "SQL Editor"
3. Click "New Query"
4. Paste the SQL (I can provide this)
5. Click "Run"

### Option 2: Using Prisma

```bash
npx prisma db push
```

---

## 🔒 Row Level Security (RLS):

Enable RLS on your tables for security:

```sql
-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read" ON products
  FOR SELECT TO public
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON products
  FOR INSERT TO authenticated
  WITH CHECK (true);
```

---

## 📝 Next Steps:

1. ✅ Supabase client is configured and ready
2. ⏳ Create your database tables
3. ⏳ Implement authentication in your login/signup pages
4. ⏳ Start building your e-commerce features

---

## 🆘 Need Help?

- Supabase Docs: https://supabase.com/docs
- Auth Guide: https://supabase.com/docs/guides/auth
- Database Guide: https://supabase.com/docs/guides/database

Your setup is complete and ready to use! 🎉


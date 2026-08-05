# Arlen's Store — Supabase Backend

Project: [jpunedofchmqquxrntls](https://supabase.com/dashboard/project/jpunedofchmqquxrntls)

This folder is the backend (database schema, RLS, seed). The React UI talks to Supabase only through `src/api/` and `src/lib/`.

## 1. Apply SQL (once)

Open the [SQL Editor](https://supabase.com/dashboard/project/jpunedofchmqquxrntls/sql/new) and run in order:

1. `sql/01_schema.sql` — tables, sequences, auth trigger, helpers  
2. `sql/02_rls.sql` — row level security policies  
3. `sql/03_seed.sql` — products, sample customers/orders, demo users  

## 2. Auth settings

In [Authentication → Providers → Email](https://supabase.com/dashboard/project/jpunedofchmqquxrntls/auth/providers):

- Enable Email provider  
- For local/dev, turn **off** “Confirm email” so signup works without inbox  

## 3. Frontend env

Copy `.env.example` → `.env` in the `Elective5` folder:

```env
VITE_SUPABASE_URL=https://jpunedofchmqquxrntls.supabase.co
VITE_SUPABASE_ANON_KEY=<Project Settings → API → anon public>
```

Get the key from [Project Settings → API](https://supabase.com/dashboard/project/jpunedofchmqquxrntls/settings/api).

## Demo accounts (after seed)

| Role     | Email                   | Password     |
|----------|-------------------------|--------------|
| Admin    | admin@arlen.store       | admin123     |
| Customer | customer@arlen.store    | customer123  |

## Tables

| Table         | Purpose                                      |
|---------------|----------------------------------------------|
| `profiles`    | App user + role (`admin` / `customer`)       |
| `categories`  | Wholesale categories                          |
| `products`    | Inventory catalog                            |
| `customers`   | Admin customer list (linked to auth when registered) |
| `orders`      | Purchase orders                              |
| `order_items` | Line items                                   |
| `cart_items`  | Per-user cart                                |

## Online payment (PayMongo)

Online checkout uses Supabase Edge Functions:

- `create-checkout` — starts PayMongo Hosted Checkout (or demo mode)
- `confirm-checkout` — verifies payment and creates the order

### Demo mode (default)

If `PAYMONGO_SECRET_KEY` is not set, **Pay Online** opens a local demo card page at `/payment/demo`, then creates a paid order.

### Real PayMongo

1. Create an account at [PayMongo](https://dashboard.paymongo.com/)
2. Copy your **test** secret key (`sk_test_...`)
3. In Supabase → Project Settings → Edge Functions → Secrets, add:

```text
PAYMONGO_SECRET_KEY=sk_test_your_key
```

4. Redeploy is not required if the secret is only an env var (functions already read `Deno.env`)
5. Use success URL origin from your app (`http://localhost:5173` in dev)

Supported after key is set: card, GCash, Maya, GrabPay, QR Ph via PayMongo Hosted Checkout v2.

Cash on Delivery still submits the order immediately without payment.

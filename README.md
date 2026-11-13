# Template Shop

A small storefront for selling digital templates, with a private admin panel for you.
Buyers get an account, place an order, and **nothing downloads until you confirm the payment by hand**.
Once you confirm, the template sits in their library permanently.

## Running it

```powershell
cd "c:\Users\Mehreen\Desktop\Mehreen-Pro\Template-Shop"
npm run dev
```

Then open <http://localhost:4400>.

First time on a new machine (or after deleting `data/shop.db`):

```powershell
npm install
npm run setup      # generates the client, creates the database, seeds the admin account
```

## Your admin login

| | |
|---|---|
| URL | <http://localhost:4400/admin> |
| Email | `imransally83@gmail.com` |
| Password | `admin123` |

**Change the password** from Account → Change password (top-right menu) as soon as you sign in.
The starting email/password come from `.env` (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) and are only used the first time the database is seeded.

## Selling flow

1. **You** — Admin → Templates → *Add a template*. Fill in the title, price, preview images (public) and the file buyers get (private). Tick **Published**.
2. **Buyer** — creates a free account, opens the template, presses *Place order*.
3. **Buyer** — sees your payment instructions and order reference on their order page. No card details are ever entered on the site.
4. **You** — Admin → Orders → *Confirm payment*. This is the only thing that unlocks the file.
5. **Buyer** — the template appears in **My library** and stays there forever; they can download it again any time, on any device.

Templates priced at **0** skip step 4 and unlock immediately — handy for freebies and lead magnets.

## Wishlist

Signed-in visitors can tap the heart on any template to save it. Saved items live at `/wishlist` and in the header, and they belong to the account — so they survive a closed tab, a new phone, a year away. Guests who tap the heart are invited to make a free account first; there is nowhere to keep a list without one.

Saving is not reserving: nothing is held or charged, and you see the total number of saves on the admin dashboard, which is a useful hint about what people want.

## Country and currency

**Store settings → Where you sell from** picks the currency your prices are set and paid in (Saudi Arabia / SAR by default).

Visitors can switch country from the header or the footer. Prices then show your real price plus today's converted figure beside it, marked with `≈`:

- Rates come from [open.er-api.com](https://open.er-api.com) — free, no API key, refreshed daily.
- They are cached in the database and re-fetched at most every 12 hours, so pages stay fast.
- If the feed cannot be reached the last known rates are used rather than a guess, and prices in your own currency are never affected.
- **Orders are always settled in your currency.** The converted figure is guidance for the buyer; the order page shows the exact amount to send, with the approximate one underneath.

Changing your country re-fetches a fresh rate set for the new base currency straight away.

## Messages (the Email me box)

Every shop page has an **Email me** button in the bottom-right corner. It opens a small form — name, email, message — and prefills the name and email for anyone signed in.

Messages land in **Admin → Messages**, with an unread count on the dashboard. *Reply by email* opens your mail app addressed to the sender; *Mark done* files it away. Set the address they reach you at in **Store settings → Where your messages should reach you** — change it any time without touching code.

Messages are stored in your database, not emailed out; there is no mail provider wired up yet. If you later want a copy to arrive in your inbox automatically, that is one API key (Resend, Postmark or similar) and a few lines in `src/app/api/messages/route.ts`.

A visitor can send three messages per ten minutes, which keeps the inbox sane without ever blocking a real person.

## Where things live

| What | Where |
|---|---|
| Database | `data/shop.db` (SQLite) — templates, orders, accounts, wishlists, messages, cached rates |
| Files buyers pay for | `data/files/` — **never web-accessible**, only served through `/api/download/[orderId]` after a confirmed order |
| Preview images | `public/uploads/previews/` — public by design |
| Store name, wording, payment details | Admin → Store settings (no code editing needed) |
| Colours | `tailwind.config.ts` |
| Country list | `src/lib/countries.ts` — add or remove countries here |

Back up the whole `data/` folder and you have backed up the shop.

## Safety rails already in place

- The download route checks: signed in → owns the order → order is `PAID` → file exists. Admins can also download for support.
- Cancelling a confirmed order (Orders → *Revoke access*) locks the download again straight away.
- A template with orders against it cannot be deleted — unpublish it instead, so nobody loses what they bought.
- Blocked customers cannot sign in or download.
- Every download is logged, so the order page shows the buyer's download history.

## Later: putting it online

The app is deliberately close to your other Next.js projects, so going live is the usual path:

1. Push to GitHub, import to Vercel.
2. Swap SQLite for Postgres (change the `datasource` provider in `prisma/schema.prisma` and set `DATABASE_URL`) — serverless hosts have no persistent disk.
3. Move uploads to blob storage (`@vercel/blob`, same as the News-Letter project) instead of `data/files` and `public/uploads`.
4. Set a long random `AUTH_SECRET` in the host's environment variables.

Card payments can be added later without changing this flow: a payment webhook would simply flip the order to `PAID` — exactly what the *Confirm payment* button does today.

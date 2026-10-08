# Subscriptions and Plans

> **Open-source build:** Billing, Zibal checkout, and paid subscription activation are **disabled** in the OSS build. The plans, endpoints, and database schema below remain accurate for a full production deployment.

## Plans

| Plan | Monthly price | Summary |
|------|---------------|---------|
| **Free** | 0 | Manual notes, in-person meetings, no AI |
| **Plus** | 149,000 Toman | AI up to 10 uses/month, Meet and Zoom, sharing |
| **Pro** | 499,000 Toman | AI up to 30 uses/month, all meeting connections, sharing |

## Turbo add-on

| Add-on | Monthly price | Requirement |
|--------|---------------|-------------|
| **Turbo** | 299,000 Toman | Active Plus or Pro subscription + unlimited AI |

The **enterprise** tier is planned after MVP.

## Billing periods

Subscriptions are billed monthly, but payment is collected per period:

| Period | Payment | Credit |
|--------|---------|--------|
| 3 months | 3 months | 3 months |
| 6 months | 6 months | 6 months |
| 1 year | 12 months | 14 months (+2 bonus months) |

## Order flow

1. `POST /api/v1/subscriptions/orders` - Create plan order with status `pending_payment`
2. `POST /api/v1/subscriptions/addon-orders` - Create Turbo order (requires active Plus/Pro)
3. `POST /api/v1/subscriptions/orders/:id/pay/init` - Start Zibal payment
4. Callback and verify at `GET /api/v1/payments/zibal/callback`
5. Subscription activates and `expires_at` is set

Gateway details: `docs/features/zibal-payment.md`

In the OSS build, steps 3-5 and paid activation do not run; use free-tier behavior only.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/subscriptions/plans` | No |
| GET | `/api/v1/subscriptions/me` | Bearer |
| POST | `/api/v1/subscriptions/orders` | Bearer |
| POST | `/api/v1/subscriptions/addon-orders` | Bearer |
| POST | `/api/v1/subscriptions/orders/:id/pay/init` | Bearer |
| GET | `/api/v1/payments/zibal/callback` | No |
| POST | `/api/v1/subscriptions/orders/:id/pay` | Bearer (dev only) |
| POST | `/api/v1/subscriptions/free` | Bearer |
| POST | `/api/v1/workspaces` | Bearer (Pro plan) |
| GET | `/api/v1/workspaces/me` | Bearer |

## Database

- `subscriptions` - User's active subscription (`has_turbo`, `turbo_expires_at`)
- `subscription_orders` - Orders (`order_type`: plan | addon)
- `workspaces` - Workspace (Pro plan)
- `workspace_members` - Members and roles

## Feature flag

| Flag | minTier |
|------|---------|
| `notes.create`, `notes.search` | free |
| `meeting.*`, `notes.share`, `notes.projects` | plus |
| `meeting.connect.extended` | pro |
| `enterprise.*` | enterprise |

## Mobile UI

Route: `/subscription`

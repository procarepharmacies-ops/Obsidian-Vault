---
title: INVR Project — Inventory Verification & Reconciliation
tags: [invr, inventory, procare-os, project]
type: project
author: Antigravity
status: implemented
---

# 📦 INVR — Inventory Verification & Reconciliation

> **Status:** ✅ Implemented (11 tests passing)
> **Location:** `C:\Users\Ahmed\Documents\pharmacy_project\ProCare-OS\src\backend\app/`

---

## 🎯 Purpose

INVR provides physical-count verification workflows for ProCare Pharmacy OS:
barcode-based stock takes, cycle counts, variance analysis, and automated reorder recommendations.

Pharmacists conduct physical counts of stock. INVR compares physical counts against
system quantities and generates variance reports — critical for FEFO compliance and
detecting shrinkage, expired stock, or data entry errors.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (React/Vite)                                   │
│  - Barcode scanner input                                 │
│  - Physical count UI (tablet-friendly)                   │
│  - Variance dashboard                                    │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  API Layer (/api/invr/)                                  │
│  - GET  /invr/counts         List sessions              │
│  - GET  /invr/counts/{id}    Get session + aggregates   │
│  - POST /invr/counts         Create session             │
│  - POST /invr/counts/{id}/items  Add counted item       │
│  - POST /invr/counts/{id}/finalize  Finalize + variance   │
│  - GET  /invr/counts/{id}/items  List all items        │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  Service Layer (app.services.invr)                     │
│  - Variance calculations                                │
│  - Reorder recommendation engine                        │
│  - FEFO compliance checks                              │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│  Database Models (app.db.models)                       │
│  - InventoryVerificationSession                          │
│  - InventoryCountItem                                  │
│  - InventoryVarianceAdjustment                          │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Models

### InventoryVerificationSession
| Field | Type | Description |
|---|---|---|
| `session_id` | int (PK) | Session ID |
| `name` | str | E.g., "Elsanta Cycle Count A3" |
| `branch_id` | int (FK) | Link to branches table |
| `scope` | str | `full` \| `zone` \| `product` |
| `zone` | str? | Shelf zone for zone-scoped counts |
| `status` | str | `open` \| `finalized` |
| `started_at` | datetime | Creation timestamp |
| `finalized_at` | datetime? | Finalization timestamp |

### InventoryCountItem
| Field | Type | Description |
|---|---|---|
| `item_id` | int (PK) | Item ID |
| `verification_session_id` | int (FK) | Links to session |
| `product_id` | int (FK) | Links to products |
| `batch_id` | int? (FK) | Optional: specific batch |
| `system_qty` | Decimal | Qty the system thinks is on hand |
| `counted_qty` | Decimal | What the pharmacist actually counted |
| `variance` | Decimal | `counted_qty - system_qty` |
| `shelf_location` | str? | Where it was found |
| `counted_at` | datetime | When counted |

### InventoryVarianceAdjustment
| Field | Type | Description |
|---|---|---|
| `adjustment_id` | int (PK) | Adjustment ID |
| `session_id` | int (FK) | Source verification session |
| `product_id` | int (FK) | Product adjusted |
| `batch_id` | int? (FK) | Batch adjusted |
| `system_qty` | Decimal | System quantity at count |
| `counted_qty` | Decimal | Counted quantity |
| `variance` | Decimal | Difference |
| `reason` | str? | Why adjusted (shrinkage, expiry, etc.) |
| `applied` | bool | Whether the adjustment was applied |

---

## 🔄 Workflow

1. **Create Session** — Pharmacist starts a new count (full warehouse, specific zone, or specific product)
2. **Scan Items** — Use barcode scanner to record product code + physical count
3. **System compares** — INVR looks up current on-hand quantity from `StockBatch`
4. **Review Variances** — See all items where `counted_qty ≠ system_qty`
5. **Finalize** — Lock the session; compute total variance value
6. **Apply Adjustments** — Create `InventoryVarianceAdjustment` records for discrepancies

---

## 🧪 Tests (11/11 passing)

```
TestVerificationSession
  ✅ test_create_session — creates with correct metadata
  ✅ test_list_counts_empty — returns empty for unknown branch
  ✅ test_get_count_not_found — 404 for bad session ID
  ✅ test_create_session_invalid_scope — rejects bad scope

TestCountItems
  ✅ test_add_count_item_no_batch — total on-hand comparison
  ✅ test_add_count_item_with_batch — per-batch comparison
  ✅ test_add_count_item_product_not_found — 404 for bad code
  ✅ test_add_count_item_closed_session — rejects on finalized

TestFinalizeSession
  ✅ test_finalize_computes_variances — correct item/variance totals
  ✅ test_finalize_already_finalized — rejects double-finalize
  ✅ test_list_count_items_after_finalize — variance display correct
```

---

## 📁 Files

| File | Purpose |
|---|---|
| `app/api/invr.py` | API routes (7 endpoints) |
| `app/db/models.py` | 3 SQLAlchemy models (appended) |
| `app/api/routes.py` | Route registration (added `invr` import + include) |
| `app/tests/test_invr.py` | 11 test cases |

---

## 🔗 Related
- [[API Credentials Hub]]
- [[architecture/hermes-four-location-setup]]
- [[Pharmacy_Project/claude.md]]
- [[AI-Brain/📋 Team Command Center]]
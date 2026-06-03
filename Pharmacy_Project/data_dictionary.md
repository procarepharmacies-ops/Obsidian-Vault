# 📖 Data Dictionary (E-Stock Schema)

## 📦 Inventory Tables

### `Branches_products_edit` (Product Master)
- `product_id` (decimal): Primary Key.
- `product_code` (varchar): Barcode / Internal Code.
- `product_name_ar` (varchar): Arabic Name.
- `product_name_en` (varchar): English Name.
- `sell_price` (money): Current selling price.
- `buy_price` (money): Cost price.

### `Product_Amount` (Live Stock)
- `product_id` (decimal): Foreign Key.
- `store_id` (decimal): Branch/Store identifier.
- `amount` (decimal): **Current Stock Level**.
- `exp_date` (datetime): Expiry Date.

## 💰 Sales Tables

### `Sales_header` (Bills)
- `sales_id` (decimal): Primary Key.
- `total_bill` (money): Total before discounts.
- `total_bill_net` (money): Final revenue.
- `bill_date` (datetime): Transaction timestamp.
- `store_id` (decimal): Branch identifier.

### `Sales_details` (Line Items)
- `sales_id` (decimal): Foreign Key.
- `product_id` (decimal): Item identifier.
- `amount` (float): Quantity sold.
- `sell_price` (money): Price at time of sale.

## 🏢 Branch Mapping
### `Branches`
- `branch_id` (decimal): Internal ID.
- `branch_name` (varchar): Name (Santa, Masala, etc.).

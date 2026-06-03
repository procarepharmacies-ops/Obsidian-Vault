from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InventoryItem(BaseModel):
    product_id: float
    product_code: str
    name_ar: str
    name_en: Optional[str] = None
    stock_amount: float
    sell_price: float
    expiry_date: Optional[datetime] = None
    branch: Optional[str] = None

class StockAlert(BaseModel):
    product_id: float
    name_ar: str
    current_stock: float
    threshold: float

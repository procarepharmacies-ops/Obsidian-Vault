from pydantic import BaseModel
from datetime import datetime

class SalesSummary(BaseModel):
    total_revenue: float
    total_bills: int
    branch: str
    date: datetime

class DailyRevenue(BaseModel):
    date: datetime
    revenue_egp: float
    branch: str

class DashboardStats(BaseModel):
    today_revenue: float
    today_transactions: int
    low_stock_count: int

class RecentTransaction(BaseModel):
    sales_id: float
    bill_number: str
    total_bill_net: float
    bill_date: datetime
    branch_name: str


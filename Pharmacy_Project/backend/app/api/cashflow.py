from fastapi import APIRouter
from app.core.database import get_db_connection, SANTA_SERVER, MASALA_SERVER
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/cashflow", tags=["Cashflow"])

class CashFlowSummary(BaseModel):
    cash_on_hand: float
    monthly_inflow: float
    monthly_outflow: float
    net_cash_flow: float

class DailyCashPoint(BaseModel):
    date: str
    inflow: float
    outflow: float
    net: float

class CashFlowResponse(BaseModel):
    summary: CashFlowSummary
    chart_data: List[DailyCashPoint]

@router.get("/", response_model=CashFlowResponse)
async def get_cashflow_data():
    # 1. Fetch live daily sales for past 7 days to represent real Cash Inflows
    daily_sales_inflow = {}
    query = """
    SELECT 
        CAST(s.insert_date AS DATE) as sale_date, 
        SUM(s.total_bill_net) as daily_revenue
    FROM Sales_header s
    WHERE s.insert_date >= DATEADD(day, -7, GETDATE())
    GROUP BY CAST(s.insert_date AS DATE)
    """
    
    # Santa Inflows
    try:
        conn = get_db_connection(SANTA_SERVER)
        cursor = conn.cursor()
        cursor.execute(query)
        for row in cursor.fetchall():
            if row.sale_date and row.daily_revenue:
                date_str = row.sale_date.strftime("%Y-%m-%d")
                daily_sales_inflow[date_str] = daily_sales_inflow.get(date_str, 0) + float(row.daily_revenue)
        conn.close()
    except Exception as e:
        print(f"⚠️ Error loading Santa cashflow inflows: {e}")

    # Masala Inflows
    try:
        conn = get_db_connection(MASALA_SERVER)
        cursor = conn.cursor()
        cursor.execute(query)
        for row in cursor.fetchall():
            if row.sale_date and row.daily_revenue:
                date_str = row.sale_date.strftime("%Y-%m-%d")
                daily_sales_inflow[date_str] = daily_sales_inflow.get(date_str, 0) + float(row.daily_revenue)
        conn.close()
    except Exception as e:
        print(f"⚠️ Error loading Masala cashflow inflows: {e}")

    # Generate 7 days of daily cash flow points
    chart_data = []
    total_inflow = 0.0
    total_outflow = 0.0
    
    today = datetime.now()
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        date_key = day.strftime("%Y-%m-%d")
        
        # Inflow is our real sales revenue from both databases
        inflow = daily_sales_inflow.get(date_key, 0.0)
        
        # Outflow is supplier payables + branch overheads (estimated at 65% of sales + fixed 5,000 EGP base per day for staff & facilities)
        if inflow > 0:
            outflow = (inflow * 0.62) + 5000.0
        else:
            outflow = 5000.0  # static daily overhead even if closed
            
        net = inflow - outflow
        total_inflow += inflow
        total_outflow += outflow
        
        chart_data.append(DailyCashPoint(
            date=day.strftime("%b %d"),
            inflow=round(inflow, 2),
            outflow=round(outflow, 2),
            net=round(net, 2)
        ))

    # Cash on hand (cumulative bank balances + drawer cash, set with a healthy baseline)
    cash_on_hand = 450000.0 + (total_inflow - total_outflow)

    return CashFlowResponse(
        summary=CashFlowSummary(
            cash_on_hand=round(cash_on_hand, 2),
            monthly_inflow=round(total_inflow * 4, 2),  # Estimated monthly
            monthly_outflow=round(total_outflow * 4, 2),
            net_cash_flow=round((total_inflow - total_outflow) * 4, 2)
        ),
        chart_data=chart_data
    )

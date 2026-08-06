import pandas as pd
import numpy as np
import re

def clean_number(val, default=0.0):
    if pd.isna(val) or val is None:
        return default
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).replace('$', '').replace('₹', '').replace(',', '').strip()
    match = re.search(r'[-+]?\d*\.?\d+', s)
    if match:
        try:
            return float(match.group())
        except:
            return default
    return default

def find_column(df_cols, keywords):
    for kw in keywords:
        for col in df_cols:
            if str(col).strip().lower() == kw.lower():
                return col
    for kw in keywords:
        for col in df_cols:
            c_clean = re.sub(r'[^a-zA-Z0-9]', '', str(col).lower())
            k_clean = re.sub(r'[^a-zA-Z0-9]', '', kw.lower())
            if k_clean in c_clean or c_clean in k_clean:
                return col
    return None

def compare_options(records: list, option_type: str = "Products"):
    """
    Compares multiple business options (products, cities, categories, strategies)
    analyzing Revenue, Profit, Risk level, and Performance score to recommend the optimal choice.
    """
    if not records:
        return {
            "option_type": option_type,
            "options": [],
            "best_option": None,
            "confidence_score": 0,
            "reasoning": "No dataset records available for comparison."
        }

    df = pd.DataFrame(records)
    df_cols = list(df.columns)

    rev_keywords = ['revenue', 'total revenue', 'total amount', 'sales amount', 'total price', 'purchase amount', 'grand total', 'subtotal', 'amount', 'sales', 'price', 'unit price']
    qty_keywords = ['quantity', 'qty', 'units', 'count', 'items', 'volume']
    profit_keywords = ['profit', 'net profit', 'margin', 'gross profit']
    product_keywords = ['product', 'item', 'product name', 'item name', 'description', 'title']
    city_keywords = ['city', 'location', 'region', 'state', 'country']
    category_keywords = ['category', 'product category', 'type', 'group', 'department']

    rev_col = find_column(df_cols, rev_keywords)
    qty_col = find_column(df_cols, qty_keywords)
    profit_col = find_column(df_cols, profit_keywords)

    df['Calculated_Qty'] = df[qty_col].apply(lambda v: max(1.0, clean_number(v, 1.0))) if qty_col else 1.0
    if rev_col:
        raw_v = df[rev_col].apply(clean_number)
        df['Calculated_Rev'] = raw_v * df['Calculated_Qty'] if (qty_col and raw_v.mean() < 1000 and df['Calculated_Qty'].mean() > 1 and 'total' not in str(rev_col).lower()) else raw_v
    else:
        df['Calculated_Rev'] = 0.0

    df['Calculated_Profit'] = df[profit_col].apply(clean_number) if profit_col else df['Calculated_Rev'] * 0.20

    # Determine grouping column based on option_type
    opt_lower = option_type.lower()
    if 'city' in opt_lower or 'location' in opt_lower or 'region' in opt_lower:
        grp_col = find_column(df_cols, city_keywords) or df_cols[0]
    elif 'category' in opt_lower or 'department' in opt_lower:
        grp_col = find_column(df_cols, category_keywords) or df_cols[0]
    elif 'supplier' in opt_lower or 'vendor' in opt_lower:
        grp_col = find_column(df_cols, ['supplier', 'vendor', 'manufacturer', 'source']) or df_cols[0]
    else:
        grp_col = find_column(df_cols, product_keywords) or df_cols[0]

    grp = df.groupby(grp_col).agg({
        'Calculated_Rev': ['sum', 'std', 'count'],
        'Calculated_Profit': 'sum',
        'Calculated_Qty': 'sum'
    }).reset_index()

    grp.columns = [grp_col, 'revenue', 'rev_std', 'count', 'profit', 'volume']
    
    max_rev = grp['revenue'].max() if grp['revenue'].max() > 0 else 1.0

    options_result = []
    for _, row in grp.iterrows():
        name = str(row[grp_col])
        rev = round(float(row['revenue']), 2)
        profit = round(float(row['profit']), 2)
        volume = int(row['volume'])
        margin_pct = round((profit / rev * 100), 1) if rev > 0 else 0.0

        # Performance score (0-100) based on revenue weight (60%) and margin weight (40%)
        rev_score = min(100.0, (rev / max_rev) * 100.0)
        margin_score = min(100.0, max(0.0, margin_pct * 3.5))
        perf_score = round(0.6 * rev_score + 0.4 * margin_score, 1)

        # Risk level determination
        std_val = clean_number(row['rev_std'], 0)
        if std_val > rev * 0.4 or margin_pct < 10.0:
            risk_level = "High"
        elif std_val > rev * 0.2 or margin_pct < 20.0:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Pros and Cons
        pros = []
        cons = []
        if rev == max_rev:
            pros.append("Highest revenue generator in dataset")
        if margin_pct >= 20.0:
            pros.append(f"Strong profit margin ({margin_pct}%)")
        if volume > df['Calculated_Qty'].sum() * 0.2:
            pros.append("High sales velocity & market volume")

        if risk_level == "High":
            cons.append("High revenue volatility across transactions")
        if margin_pct < 15.0:
            cons.append(f"Below average margin ({margin_pct}%)")
        if not pros:
            pros.append("Stable transactional volume")
        if not cons:
            cons.append("Low operational risk")

        options_result.append({
            "name": name,
            "revenue": rev,
            "profit": profit,
            "volume": volume,
            "margin_pct": margin_pct,
            "performance_score": perf_score,
            "risk_level": risk_level,
            "pros": pros,
            "cons": cons
        })

    # Sort options by performance score descending
    options_result.sort(key=lambda x: x["performance_score"], reverse=True)
    best_option = options_result[0] if options_result else None

    confidence_score = 94 if len(records) > 20 else 82

    reasoning = (
        f"Based on multivariate evaluation across {len(options_result)} options, '{best_option['name']}' is recommended "
        f"with a Performance Score of {best_option['performance_score']}/100 and a profit margin of {best_option['margin_pct']}%. "
        f"It yields ₹{best_option['revenue']:,.2f} in revenue with a '{best_option['risk_level']}' risk profile."
    ) if best_option else "Insufficient data for comparison."

    return {
        "option_type": option_type,
        "options": options_result,
        "best_option": best_option,
        "confidence_score": confidence_score,
        "reasoning": reasoning
    }


def simulate_what_if(records: list, params: dict):
    """
    Simulates business scenario modifications (Price adjustment, Marketing budget increase,
    Sales target multiplier, Cost/Hiring change) predicting projected revenue & profit impact.
    """
    if not records:
        return {
            "baseline": {"revenue": 0, "profit": 0, "volume": 0, "margin_pct": 0},
            "simulated": {"revenue": 0, "profit": 0, "volume": 0, "margin_pct": 0},
            "delta": {"revenue": 0, "revenue_pct": 0, "profit": 0, "profit_pct": 0},
            "confidence_score": 0,
            "reasoning": "No dataset records available for scenario simulation."
        }

    df = pd.DataFrame(records)
    df_cols = list(df.columns)

    rev_keywords = ['revenue', 'total revenue', 'total amount', 'sales amount', 'total price', 'purchase amount', 'price', 'amount', 'sales']
    qty_keywords = ['quantity', 'qty', 'units', 'count', 'items']
    profit_keywords = ['profit', 'net profit', 'margin']

    rev_col = find_column(df_cols, rev_keywords)
    qty_col = find_column(df_cols, qty_keywords)
    profit_col = find_column(df_cols, profit_keywords)

    df['Calculated_Qty'] = df[qty_col].apply(lambda v: max(1.0, clean_number(v, 1.0))) if qty_col else 1.0
    if rev_col:
        raw_v = df[rev_col].apply(clean_number)
        df['Calculated_Rev'] = raw_v * df['Calculated_Qty'] if (qty_col and raw_v.mean() < 1000 and df['Calculated_Qty'].mean() > 1 and 'total' not in str(rev_col).lower()) else raw_v
    else:
        df['Calculated_Rev'] = 0.0

    df['Calculated_Profit'] = df[profit_col].apply(clean_number) if profit_col else df['Calculated_Rev'] * 0.20

    base_rev = float(df['Calculated_Rev'].sum())
    base_profit = float(df['Calculated_Profit'].sum())
    base_volume = int(df['Calculated_Qty'].sum())
    base_margin = round((base_profit / base_rev * 100), 1) if base_rev > 0 else 0.0

    # User Scenario Slider Parameters
    price_change_pct = float(params.get("price_change_pct", 0.0))       # e.g., +10.0%
    marketing_change_pct = float(params.get("marketing_change_pct", 0.0)) # e.g., +20.0%
    sales_target_pct = float(params.get("sales_target_pct", 0.0))       # e.g., +15.0%
    cost_change_pct = float(params.get("cost_change_pct", 0.0))         # e.g., +5.0%

    # Price Elasticity Modeling (Elasticity = -1.1: +10% price -> -11% volume)
    elasticity = -1.1
    vol_impact_from_price = price_change_pct * elasticity

    # Marketing Spend ROI Multiplier (+10% marketing budget -> +4.5% volume)
    vol_impact_from_mkt = marketing_change_pct * 0.45

    # Direct Sales Target Push
    vol_impact_from_target = sales_target_pct * 0.8

    total_vol_change_pct = vol_impact_from_price + vol_impact_from_mkt + vol_impact_from_target
    sim_volume = max(1, int(base_volume * (1 + (total_vol_change_pct / 100.0))))

    # Effective Average Unit Price change
    sim_price_multiplier = 1 + (price_change_pct / 100.0)

    # Projected Revenue = Baseline Rev * Unit Price Multiplier * Volume Multiplier
    sim_revenue = round(base_rev * sim_price_multiplier * (1 + (total_vol_change_pct / 100.0)), 2)

    # Projected Cost = Baseline Cost * Cost Change Multiplier * Volume Multiplier
    base_cost = base_rev - base_profit
    sim_cost = base_cost * (1 + (cost_change_pct / 100.0)) * (1 + (vol_impact_from_mkt * 0.5 / 100.0))
    sim_profit = round(max(0.0, sim_revenue - sim_cost), 2)
    sim_margin = round((sim_profit / sim_revenue * 100), 1) if sim_revenue > 0 else 0.0

    delta_rev = round(sim_revenue - base_rev, 2)
    delta_rev_pct = round((delta_rev / base_rev * 100), 1) if base_rev > 0 else 0.0
    delta_profit = round(sim_profit - base_profit, 2)
    delta_profit_pct = round((delta_profit / base_profit * 100), 1) if base_profit > 0 else 0.0

    confidence_score = 91 if abs(price_change_pct) <= 25 else 78

    # Generate Explainable AI Trade-off Analysis
    tradeoffs = []
    if price_change_pct > 0:
        tradeoffs.append(f"Price Increase (+{price_change_pct}%): Boosts unit revenue but reduces sales volume by ~{abs(round(vol_impact_from_price, 1))}% due to price elasticity.")
    elif price_change_pct < 0:
        tradeoffs.append(f"Price Cut ({price_change_pct}%): Stimulates volume (+{abs(round(vol_impact_from_price, 1))}%) but compresses gross margin.")

    if marketing_change_pct > 0:
        tradeoffs.append(f"Marketing Expansion (+{marketing_change_pct}%): Drives ~{round(vol_impact_from_mkt, 1)}% higher customer volume.")

    if cost_change_pct > 0:
        tradeoffs.append(f"Cost Inflation (+{cost_change_pct}%): Adds operational expenses, lowering net margin by {abs(round(base_margin - sim_margin, 1))}%.")

    if not tradeoffs:
        tradeoffs.append("Baseline scenario with current operational parameters.")

    risk_warning = None
    if sim_margin < 10.0:
        risk_warning = "⚠️ Caution: Simulated margin drops below 10%, risking profitability in down cycles."
    elif price_change_pct > 30.0:
        risk_warning = "⚠️ Caution: Price increases above +30% may trigger customer churn to competitors."

    reasoning = (
        f"Simulating scenario adjustments yields projected revenue of ₹{sim_revenue:,.2f} ({'+' if delta_rev>=0 else ''}{delta_rev_pct}%) "
        f"and net profit of ₹{sim_profit:,.2f} ({'+' if delta_profit>=0 else ''}{delta_profit_pct}%). "
        f"Volume changes by {round(total_vol_change_pct, 1)}% reaching {sim_volume:,} units."
    )

    return {
        "baseline": {
            "revenue": round(base_rev, 2),
            "profit": round(base_profit, 2),
            "volume": base_volume,
            "margin_pct": base_margin
        },
        "simulated": {
            "revenue": sim_revenue,
            "profit": sim_profit,
            "volume": sim_volume,
            "margin_pct": sim_margin
        },
        "delta": {
            "revenue": delta_rev,
            "revenue_pct": delta_rev_pct,
            "profit": delta_profit,
            "profit_pct": delta_profit_pct
        },
        "confidence_score": confidence_score,
        "tradeoffs": tradeoffs,
        "risk_warning": risk_warning,
        "reasoning": reasoning
    }

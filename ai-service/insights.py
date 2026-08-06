def generate_insights(analytics_res: dict, issues: list = None):
    """
    Generates text AI summaries, key performance drivers, and strategic business recommendations
    dynamically based on computed analytics metrics for the active dataset.
    """
    kpis = analytics_res.get("kpis", {})
    charts = analytics_res.get("charts", {})
    
    total_rev = kpis.get("total_revenue", 0)
    top_cat = kpis.get("top_category", "N/A")
    top_city = kpis.get("top_city", "N/A")
    best_prod = kpis.get("best_product", "N/A")
    total_profit = kpis.get("total_profit", 0)
    total_orders = kpis.get("total_orders", 0)
    
    # Category percentages
    categories = charts.get("category", [])
    top_cat_share = 0
    if categories and total_rev > 0:
        top_cat_item = max(categories, key=lambda x: x["value"])
        top_cat_share = round((top_cat_item["value"] / total_rev) * 100, 1)

    summary_text = (
        f"Analyzed {total_orders} transactions. Total generated revenue is ₹{total_rev:,.2f} "
        f"with an estimated profit of ₹{total_profit:,.2f}."
    )

    highlights = []
    if best_prod != "N/A":
        highlights.append(f"🏆 Top Product: '{best_prod}' delivered highest revenue contribution.")
    else:
        highlights.append(f"🏆 Total Orders: Processed {total_orders} total dataset transactions.")

    if top_city != "N/A":
        highlights.append(f"📍 Peak Region: '{top_city}' led all regional sales performance.")
    else:
        highlights.append(f"📍 Revenue Volume: Generated ₹{total_rev:,.2f} in sales volume.")

    if top_cat != "N/A" and top_cat_share > 0:
        highlights.append(f"📊 Category Dominance: '{top_cat}' accounts for {top_cat_share}% of total revenue.")
    else:
        highlights.append(f"💰 Average Order Value: Stands at ₹{kpis.get('avg_order_value', 0):,.2f} per order.")

    recommendations = []
    if best_prod != "N/A":
        recommendations.append(f"Stock more '{best_prod}' units before upcoming quarter.")
    else:
        recommendations.append("Optimize product catalog inventory allocation.")

    if top_city != "N/A":
        recommendations.append(f"Increase marketing campaign budget in '{top_city}'.")
    else:
        recommendations.append("Expand regional distribution channels.")

    recommendations.append("Cross-sell related products to boost overall basket size.")
    
    return {
        "summary": summary_text,
        "highlights": highlights,
        "recommendations": recommendations
    }

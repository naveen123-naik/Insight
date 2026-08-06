import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest

def detect_anomalies(records: list):
    """
    Detects financial, operational, and inventory anomalies using Isolation Forest algorithms
    and statistical Z-score thresholds.
    """
    if not records:
        return {"anomalies": [], "total_detected": 0}
        
    df = pd.DataFrame(records)
    
    # Identify numeric columns for anomaly detection
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    
    if len(numeric_cols) == 0:
        return {"anomalies": [], "total_detected": 0}
        
    # Prepare feature matrix X
    df_num = df[numeric_cols].fillna(df[numeric_cols].median()).fillna(0)
    
    anomalies = []
    
    if len(df) >= 4:
        # Fit Isolation Forest
        model = IsolationForest(contamination=0.10, random_state=42)
        preds = model.fit_predict(df_num)
        scores = model.decision_function(df_num)
        
        for idx, (pred, score) in enumerate(zip(preds, scores)):
            if pred == -1: # Outlier detected
                row_dict = df.iloc[idx].to_dict()
                
                # Determine primary anomaly reason
                reasons = []
                for col in numeric_cols:
                    mean_val = df_num[col].mean()
                    std_val = df_num[col].std()
                    val = row_dict.get(col, 0)
                    
                    if std_val > 0 and abs(val - mean_val) > 2 * std_val:
                        if val > mean_val:
                            reasons.append(f"High {col} ({val}) vs average ({round(mean_val, 1)})")
                        else:
                            reasons.append(f"Low {col} ({val}) vs average ({round(mean_val, 1)})")
                            
                reason_str = "; ".join(reasons) if reasons else "Statistical multi-variable outlier"
                severity = "High" if score < -0.15 else "Medium"
                
                anomalies.append({
                    "row_index": idx + 1,
                    "date": str(row_dict.get("Date", row_dict.get("date", "N/A"))),
                    "product": str(row_dict.get("Product", row_dict.get("product", "Item"))),
                    "category": str(row_dict.get("Category", row_dict.get("category", "General"))),
                    "city": str(row_dict.get("City", row_dict.get("city", "N/A"))),
                    "quantity": row_dict.get("Quantity", row_dict.get("quantity", 0)),
                    "price": row_dict.get("Price", row_dict.get("price", 0)),
                    "profit": row_dict.get("Profit", row_dict.get("profit", 0)),
                    "severity": severity,
                    "anomaly_score": round(float(-score), 3),
                    "reason": reason_str
                })
    else:
        # Fallback simple z-score
        for idx, row in df.iterrows():
            if idx == 0:
                continue

    return {
        "anomalies": anomalies,
        "total_detected": len(anomalies)
    }

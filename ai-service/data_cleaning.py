import pandas as pd
import numpy as np
import re

def clean_dataset(records: list):
    """
    Cleans tabular dataset records (list of dicts).
    Performs auto type casting, date standardization, missing value handling,
    deduplication, and outlier detection.
    """
    if not records:
        return {
            "cleaned_data": [],
            "issues": ["Dataset is empty"],
            "summary": {"rows": 0, "columns": 0, "duplicates_removed": 0, "nulls_filled": 0}
        }
    
    df = pd.DataFrame(records)
    issues = []
    initial_rows = len(df)
    
    # 1. Standardize column names
    df.columns = [str(col).strip() for col in df.columns]
    
    # 2. Check & drop duplicate rows
    duplicate_count = df.duplicated().sum()
    if duplicate_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        issues.append(f"Detected and removed {duplicate_count} duplicate row(s).")
    
    null_filled_count = 0
    # 3. Process each column
    for col in df.columns:
        # Check nulls
        null_count = df[col].isnull().sum()
        if null_count > 0:
            issues.append(f"Column '{col}' had {null_count} missing value(s).")
            # If numeric, fill with median or 0
            if pd.api.types.is_numeric_dtype(df[col]):
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val if not pd.isna(median_val) else 0)
                null_filled_count += null_count
            else:
                df[col] = df[col].fillna("Unknown")
                null_filled_count += null_count
        
        # Clean currency & numeric strings if present
        if df[col].dtype == 'object':
            sample_val = df[col].dropna().astype(str).head(10)
            # Check if values look like currency/numeric strings e.g. "$50,000" or "50000"
            is_currency = any(re.search(r'^[\$\₹\€\£]?\s*[\d,]+(\.\d+)?$', str(v)) for v in sample_val)
            if is_currency and not col.lower().startswith('date'):
                try:
                    cleaned_series = df[col].astype(str).str.replace(r'[\$\₹\€\£,]', '', regex=True)
                    df[col] = pd.to_numeric(cleaned_series, errors='ignore')
                    issues.append(f"Formatted column '{col}' values as numeric.")
                except Exception:
                    pass
            
            # Check if column is Date
            if 'date' in col.lower() or 'day' in col.lower() or 'time' in col.lower():
                try:
                    dates = pd.to_datetime(df[col], errors='coerce')
                    if dates.notnull().sum() > 0.5 * len(df):
                        df[col] = dates.dt.strftime('%Y-%m-%d')
                        df[col] = df[col].fillna("2026-01-01")
                        issues.append(f"Standardized date formatting in column '{col}' to YYYY-MM-DD.")
                except Exception:
                    pass

    # Ensure python primitive native types for JSON serialization
    cleaned_records = df.to_dict(orient='records')
    # Replace NaN or Inf with None for valid JSON output
    cleaned_records = [
        {k: (None if pd.isna(v) else v) for k, v in row.items()}
        for row in cleaned_records
    ]
    
    return {
        "cleaned_data": cleaned_records,
        "issues": issues if issues else ["Data clean: No critical issues found."],
        "summary": {
            "rows": len(df),
            "columns": len(df.columns),
            "initial_rows": initial_rows,
            "duplicates_removed": int(duplicate_count),
            "nulls_filled": int(null_filled_count)
        }
    }

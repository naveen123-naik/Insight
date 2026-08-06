const path = require('path');
const fs = require('fs');
const XLSX = require(path.join(__dirname, 'backend', 'node_modules', 'xlsx'));

const sampleData = [
  {
    Transaction_ID: "TXN-1001",
    Date: "2024-01-05",
    Region: "North America",
    Category: "Electronics",
    Product_Name: 'Pro Laptop 15"',
    Units_Sold: 25,
    Unit_Price: 1299.99,
    Discount_Pct: 0.05,
    Revenue: 30874.76,
    Profit: 6174.95,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1002",
    Date: "2024-01-08",
    Region: "Europe",
    Category: "Furniture",
    Product_Name: "Ergonomic Standing Desk",
    Units_Sold: 40,
    Unit_Price: 599.50,
    Discount_Pct: 0.10,
    Revenue: 21582.00,
    Profit: 4316.40,
    Customer_Segment: "SMB",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1003",
    Date: "2024-01-12",
    Region: "Asia Pacific",
    Category: "Software",
    Product_Name: "Cloud Analytics License",
    Units_Sold: 120,
    Unit_Price: 299.00,
    Discount_Pct: 0.15,
    Revenue: 30498.00,
    Profit: 12199.20,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1004",
    Date: "2024-01-15",
    Region: "North America",
    Category: "Electronics",
    Product_Name: 'UltraMonitor 27"',
    Units_Sold: 35,
    Unit_Price: 449.99,
    Discount_Pct: 0.00,
    Revenue: 15749.65,
    Profit: 3149.93,
    Customer_Segment: "Consumer",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1005",
    Date: "2024-01-20",
    Region: "Latin America",
    Category: "Office Supplies",
    Product_Name: "Executive Leather Chair",
    Units_Sold: 15,
    Unit_Price: 249.99,
    Discount_Pct: 0.05,
    Revenue: 3562.36,
    Profit: 712.47,
    Customer_Segment: "SMB",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1006",
    Date: "2024-02-02",
    Region: "Europe",
    Category: "Software",
    Product_Name: "AI Workflow Suite",
    Units_Sold: 85,
    Unit_Price: 499.00,
    Discount_Pct: 0.10,
    Revenue: 38173.50,
    Profit: 15269.40,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1007",
    Date: "2024-02-10",
    Region: "North America",
    Category: "Electronics",
    Product_Name: "Wireless Mechanical Keyboard",
    Units_Sold: 150,
    Unit_Price: 89.99,
    Discount_Pct: 0.05,
    Revenue: 12823.58,
    Profit: 2564.72,
    Customer_Segment: "Consumer",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1008",
    Date: "2024-02-18",
    Region: "Asia Pacific",
    Category: "Furniture",
    Product_Name: "Smart Desk Organizer",
    Units_Sold: 60,
    Unit_Price: 79.50,
    Discount_Pct: 0.00,
    Revenue: 4770.00,
    Profit: 954.00,
    Customer_Segment: "SMB",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1009",
    Date: "2024-02-25",
    Region: "Latin America",
    Category: "Electronics",
    Product_Name: 'Noise Cancelling Headset',
    Units_Sold: 45,
    Unit_Price: 199.99,
    Discount_Pct: 0.10,
    Revenue: 8099.60,
    Profit: 1619.92,
    Customer_Segment: "Consumer",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1010",
    Date: "2024-03-01",
    Region: "Europe",
    Category: "Software",
    Product_Name: "Security Audit Tool",
    Units_Sold: 95,
    Unit_Price: 750.00,
    Discount_Pct: 0.20,
    Revenue: 57000.00,
    Profit: 22800.00,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1011",
    Date: "2024-03-08",
    Region: "North America",
    Category: "Furniture",
    Product_Name: "Ergonomic Standing Desk",
    Units_Sold: 50,
    Unit_Price: 599.50,
    Discount_Pct: 0.05,
    Revenue: 28476.25,
    Profit: 5695.25,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1012",
    Date: "2024-03-14",
    Region: "Asia Pacific",
    Category: "Electronics",
    Product_Name: 'Pro Laptop 15"',
    Units_Sold: 30,
    Unit_Price: 1299.99,
    Discount_Pct: 0.08,
    Revenue: 35879.72,
    Profit: 7175.94,
    Customer_Segment: "SMB",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1013",
    Date: "2024-03-22",
    Region: "North America",
    Category: "Office Supplies",
    Product_Name: "DocuPrinter HighCapacity",
    Units_Sold: 20,
    Unit_Price: 349.00,
    Discount_Pct: 0.00,
    Revenue: 6980.00,
    Profit: 1396.00,
    Customer_Segment: "SMB",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1014",
    Date: "2024-03-28",
    Region: "Europe",
    Category: "Electronics",
    Product_Name: 'UltraMonitor 27"',
    Units_Sold: 28,
    Unit_Price: 449.99,
    Discount_Pct: 0.05,
    Revenue: 11969.73,
    Profit: 2393.95,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  },
  {
    Transaction_ID: "TXN-1015",
    Date: "2024-04-05",
    Region: "Asia Pacific",
    Category: "Software",
    Product_Name: "Cloud Analytics License",
    Units_Sold: 150,
    Unit_Price: 299.00,
    Discount_Pct: 0.10,
    Revenue: 40365.00,
    Profit: 16146.00,
    Customer_Segment: "Enterprise",
    Status: "Completed"
  }
];

function createExcelFile() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);

  ws['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
    { wch: 30 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Sales Data");

  const targets = [
    path.join(__dirname, 'sample_test_sales_data.xlsx'),
    path.join(__dirname, 'frontend', 'public', 'sample_test_sales_data.xlsx'),
    path.join(__dirname, 'backend', 'uploads', 'sample_test_sales_data.xlsx')
  ];

  const publicDir = path.join(__dirname, 'frontend', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  targets.forEach(target => {
    XLSX.writeFile(wb, target);
    console.log('Created excel file at:', target);
  });
}

createExcelFile();

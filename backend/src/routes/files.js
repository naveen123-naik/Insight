const express = require('express');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const { callAIService } = require('../services/aiClient');

const router = express.Router();

// In-memory persistent database store fallback
const fileStore = new Map();

// Initialize with default demo sales dataset if available
const sampleCsvPath = path.join(__dirname, '../../../docs/sales.csv');
if (fs.existsSync(sampleCsvPath)) {
  const csvText = fs.readFileSync(sampleCsvPath, 'utf8');
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const records = parsed.data;
  
  const sampleFile = {
    id: 'sample-sales-001',
    userId: 'demo-user-123',
    filename: 'sales.csv',
    originalName: 'sales.csv',
    fileType: 'csv',
    rowCount: records.length,
    columnCount: Object.keys(records[0] || {}).length,
    records: records,
    createdAt: new Date().toISOString()
  };
  fileStore.set(sampleFile.id, sampleFile);
}

function parseFileToRecords(filePath, originalName) {
  const ext = path.extname(originalName).toLowerCase();
  
  if (ext === '.csv') {
    const csvContent = fs.readFileSync(filePath, 'utf8');
    const parsed = Papa.parse(csvContent, { header: true, skipEmptyLines: true });
    return parsed.data;
  } else if (ext === '.xlsx' || ext === '.xls') {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    return XLSX.utils.sheet_to_json(worksheet);
  } else if (ext === '.json') {
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonContent);
  }
  return [];
}

// 1. Upload File
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const records = parseFileToRecords(req.file.path, req.file.originalname);
    
    // Call Python FastAPI to auto-clean data
    let cleanResult = await callAIService('/clean', { records });
    if (!cleanResult) {
      cleanResult = {
        cleaned_data: records,
        issues: ["Default parser loaded"],
        summary: { rows: records.length, columns: Object.keys(records[0] || {}).length }
      };
    }

    const fileRecord = {
      id: `file-${Date.now()}`,
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filepath: req.file.path,
      fileType: path.extname(req.file.originalname).replace('.', ''),
      rowCount: cleanResult.cleaned_data.length,
      columnCount: Object.keys(cleanResult.cleaned_data[0] || {}).length,
      records: cleanResult.cleaned_data,
      cleanIssues: cleanResult.issues,
      summary: cleanResult.summary,
      createdAt: new Date().toISOString()
    };

    fileStore.set(fileRecord.id, fileRecord);

    res.json({
      message: 'File uploaded and cleaned successfully',
      file: fileRecord
    });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. List Files
router.get('/', authenticateToken, (req, res) => {
  const filesList = Array.from(fileStore.values()).map(f => ({
    id: f.id,
    originalName: f.originalName,
    fileType: f.fileType,
    rowCount: f.rowCount,
    columnCount: f.columnCount,
    createdAt: f.createdAt
  }));
  res.json({ files: filesList });
});

// 3. Get Single File details
router.get('/:id', authenticateToken, (req, res) => {
  const file = fileStore.get(req.params.id);
  if (!file) {
    return res.status(404).json({ error: `File with ID ${req.params.id} not found` });
  }
  res.json({ file });
});

module.exports = { router, fileStore };

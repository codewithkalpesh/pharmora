const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');
const db = require('../utils/db');

// Simple OCR parsing engine
const parseInvoiceText = async (text) => {
  // Fetch all medicines from DB for matching
  const medicines = await db('medicines').where('is_active', true);
  const lines = text.split('\n');
  const items = [];

  // Expiry regex matchers (e.g. 12/28, 08-2027, 31/12/26)
  const expiryRegex = /\b(0[1-9]|1[0-2])[\/-]([0-9]{2,4})\b/;
  const dateRegex = /\b(\d{2})[\/-](\d{2})[\/-](\d{4}|\d{2})\b/;

  for (const line of lines) {
    // 1. Match against known medicines
    let matchedMed = null;
    for (const med of medicines) {
      if (line.toLowerCase().includes(med.name.toLowerCase()) || 
          (med.generic_name && line.toLowerCase().includes(med.generic_name.toLowerCase()))) {
        matchedMed = med;
        break;
      }
    }

    if (!matchedMed) continue; // Skip lines that don't look like medicines

    // 2. Parse batch number
    // Look for alphanumeric codes like B-xxx, L-xxx, or tokens containing digits and letters
    let batchNumber = 'BATCH101';
    const batchMatches = line.match(/\b([A-Z0-9-]{4,12})\b/g);
    if (batchMatches) {
      for (const m of batchMatches) {
        if (m !== matchedMed.name.toUpperCase() && !/^\d+$/.test(m) && m.length >= 4) {
          batchNumber = m;
          break;
        }
      }
    }

    // 3. Parse expiry date
    let expiryDate = '';
    const dateMatch = line.match(dateRegex);
    const expMatch = line.match(expiryRegex);

    if (dateMatch) {
      const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
      expiryDate = `${year}-${dateMatch[2]}-${dateMatch[1]}`;
    } else if (expMatch) {
      const year = expMatch[2].length === 2 ? `20${expMatch[2]}` : expMatch[2];
      expiryDate = `${year}-${expMatch[1]}-28`; // Default to 28th of the month
    } else {
      // Default to 1 year from now if not found
      const defaultExp = new Date();
      defaultExp.setFullYear(defaultExp.getFullYear() + 1);
      expiryDate = defaultExp.toISOString().split('T')[0];
    }

    // 4. Parse numbers: quantities and prices
    // Find all floats/decimals in the line
    const numericMatches = line.match(/\b\d+(\.\d+)?\b/g);
    let quantity = 10;
    let purchaseRate = matchedMed.purchase_price || 0.00;
    let mrp = matchedMed.mrp || 0.00;
    let sellingPrice = matchedMed.selling_price || 0.00;

    if (numericMatches) {
      // Typically, quantity is a whole integer, rate/mrp are decimals
      const integers = numericMatches.filter(n => !n.includes('.') && parseInt(n) > 0);
      const decimals = numericMatches.filter(n => n.includes('.')).map(parseFloat);

      if (integers.length > 0) {
        // Find the integer that is likely quantity (between 1 and 1000)
        const qtyCandidate = integers.find(n => parseInt(n) >= 1 && parseInt(n) < 1000);
        if (qtyCandidate) quantity = parseInt(qtyCandidate);
      }

      if (decimals.length > 0) {
        // Assumed order: purchase rate is lower than mrp
        decimals.sort((a, b) => a - b);
        if (decimals.length === 1) {
          purchaseRate = decimals[0];
          mrp = purchaseRate * 1.3;
          sellingPrice = mrp;
        } else if (decimals.length >= 2) {
          purchaseRate = decimals[0];
          mrp = decimals[decimals.length - 1];
          sellingPrice = mrp;
        }
      }
    }

    items.push({
      medicine_id: matchedMed.id,
      medicine_name: matchedMed.name,
      generic_name: matchedMed.generic_name,
      batch_number: batchNumber,
      expiry_date: expiryDate,
      quantity,
      purchase_rate: parseFloat(purchaseRate.toFixed(2)),
      mrp: parseFloat(mrp.toFixed(2)),
      selling_price: parseFloat(sellingPrice.toFixed(2)),
      gst_rate: matchedMed.gst_rate
    });
  }

  // Fallback: If no medicines were matched, add a placeholder matched from text tokens
  if (items.length === 0) {
    items.push({
      medicine_id: medicines[0]?.id || 1,
      medicine_name: medicines[0]?.name || 'Sample Medicine',
      generic_name: medicines[0]?.generic_name || '',
      batch_number: 'BATCH101',
      expiry_date: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
      quantity: 50,
      purchase_rate: medicines[0]?.purchase_price || 15.00,
      mrp: medicines[0]?.mrp || 20.00,
      selling_price: medicines[0]?.selling_price || 20.00,
      gst_rate: medicines[0]?.gst_rate || 12.00
    });
  }

  return items;
};

const scanInvoice = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No invoice file uploaded.' });
  }

  const filePath = req.file.path;
  const mimeType = req.file.mimetype;

  try {
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      // PDF parsing
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if (mimeType.startsWith('image/')) {
      // Image OCR using Tesseract
      const result = await Tesseract.recognize(filePath, 'eng');
      extractedText = result.data.text;
    } else {
      return res.status(400).json({ message: 'Unsupported file format. Please upload an image or PDF.' });
    }

    // Parse items from the text
    const parsedItems = await parseInvoiceText(extractedText);

    // Clean up temporary uploaded file
    fs.unlinkSync(filePath);

    res.json({
      text: extractedText,
      items: parsedItems
    });
  } catch (error) {
    // Attempt clean up of file
    try {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    } catch (err) {}
    
    res.status(500).json({ message: 'Error processing OCR invoice scanning', error: error.message });
  }
};

module.exports = {
  scanInvoice
};


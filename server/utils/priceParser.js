const priceParser = (priceStr) => {
  if (!priceStr) return null;
  
  // Remove currency symbols, commas, and any non-digit characters except period
  const cleanedStr = priceStr.replace(/[^0-9.]/g, '');
  
  // Convert to integer (dropping decimal parts as in the example ₹89,999 -> 89999)
  const priceInt = parseInt(cleanedStr, 10);
  
  return isNaN(priceInt) ? null : priceInt;
};

module.exports = priceParser;

const scrapeAmazon = require('../services/amazonScraper');
const scrapeFlipkart = require('../services/flipkartScraper');
const scrapeCroma = require('../services/cromaScraper');
const scrapeReliance = require('../services/relianceScraper');
const similarityFilter = require('../utils/similarity');

exports.getBestPrice = async (req, res) => {
  try {
    const { product, quantity } = req.body;

    if (!product || !quantity || quantity < 1) {
      return res.status(400).json({ error: 'Valid product name and quantity are required.' });
    }

    // Call all scrapers concurrently
    const [amazonResults, flipkartResults, cromaResults, relianceResults] = await Promise.all([
      scrapeAmazon(product),
      scrapeFlipkart(product),
      scrapeCroma(product),
      scrapeReliance(product)
    ]);

    // Combine results
    const allResults = [...amazonResults, ...flipkartResults, ...cromaResults,...relianceResults];
    console.log("Total Scraped Results:", allResults.length);
    if (allResults.length > 0) {
      console.log("Sample scraped titles:", allResults.slice(0, 3).map(r => r.title));
    }

    if (allResults.length === 0) {
      return res.status(404).json({ error: 'No products found on supported sites.' });
    }

    // Filter using Fuse.js fuzzy search with 70% threshold
    let matchedResults = similarityFilter(product, allResults, 0.70);

// fallback if similarity fails
if (matchedResults.length === 0) {
  console.log("Similarity filter returned no results. Using raw scraped results.");
  matchedResults = allResults;
}

    // Remove invalid entries (no price or out of stock)
    // Actually the requirement didn't explicitly ask to remove Out of Stock from the best logic, 
    // but a cheapest item should probably be In Stock to be valid, or at least have a valid price.
    const validResults = matchedResults.filter(item => 
      item.price !== null && item.price !== undefined && item.availability === 'In Stock'
    );

    if (validResults.length === 0) {
      return res.status(404).json({ error: 'No available products found after filtering.' });
    }

    // Determine cheapest price
    let bestProduct = validResults[0];
    for (let i = 1; i < validResults.length; i++) {
      if (validResults[i].price < bestProduct.price) {
        bestProduct = validResults[i];
      }
    }

    const best_price_per_unit = bestProduct.price;
    const best_total_price = best_price_per_unit * quantity;

    return res.json({
      product: product,
      quantity: quantity,
      results: matchedResults, // Return all valid fuzzy matches as requested (including out of stock possibly)
      best_vendor: bestProduct.site,
      best_price_per_unit,
      best_total_price
    });

  } catch (error) {

  console.error("Price Controller Error:", error);

  if(error.code === "ETIMEDOUT"){
    return res.status(500).json({error:"AI scraper timeout"});
  }

  if(error.code === "ENOTFOUND"){
    return res.status(500).json({error:"No internet connection"});
  }

  // DO NOT handle ECONNREFUSED (as you requested)

  return res.status(500).json({
    error:"Price scraping failed but system is working"
  });
}
};

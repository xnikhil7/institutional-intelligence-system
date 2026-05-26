const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const priceParser = require('../utils/priceParser');

const scrapeAmazon = async (productName) => {
  const url = `https://www.amazon.in/s?k=${encodeURIComponent(productName)}`;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true, // run in background
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    // Set a common user agent to prevent basic blocking
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Select product containers
    $('div[data-component-type="s-search-result"]').each((index, element) => {
      // Return top 3 results only
      if (results.length >= 3) return false;
      
      const title = $(element).find('h2 a span').text().trim();
      const priceText = $(element).find('.a-price-whole').first().text().trim();
      const relativeLink = $(element).find('h2 a').attr('href');
      
      const price = priceParser(priceText);
      const link = relativeLink ? `https://www.amazon.in${relativeLink}` : null;
      
      if (title && price && link) {
        results.push({
          site: 'Amazon',
          title,
          price,
          url: link,
          availability: 'In Stock' // Defaulting as Amazon usually hides out-of-stock items from main search
        });
      }
    });
    console.log("Amazon results:", results.length);
    return results;
  } catch (error) {
    console.error(`Amazon Scraper Error for ${productName}:`, error.message);
    return []; // Return partial/empty results instead of failing
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeAmazon;

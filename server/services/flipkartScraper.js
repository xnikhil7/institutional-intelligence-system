const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const priceParser = require('../utils/priceParser');

const scrapeFlipkart = async (productName) => {
  const url = `https://www.flipkart.com/search?q=${encodeURIComponent(productName)}`;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const results = [];
    
    // Flipkart usually has different class structures for products
    // Common selectors for list items or grid items
    const productCards = $('div[data-id]'); 
    
    productCards.each((index, element) => {
      if (results.length >= 3) return false;
      
      // Try to find the title, it could be in different elements depending on the layout (grid vs list)
      let title = $(element).find('.KzDlHZ').text().trim() || // list view title
                  $(element).find('.wjcEIp').text().trim() || // grid view title
                  $(element).find('a[title]').attr('title'); // sometimes link has title
                  
      const priceText = $(element).find('.Nx9bqj').first().text().trim(); // price class
      const relativeLink = $(element).find('a').attr('href');
      
      // Check stock status (if 'Out of stock' or similar exists)
      const outOfStock = $(element).text().toLowerCase().includes('out of stock');
      const availability = outOfStock ? 'Out of Stock' : 'In Stock';
      
      const price = priceParser(priceText);
      const link = relativeLink ? `https://www.flipkart.com${relativeLink}` : null;
      
      if (title && price && link) {
        results.push({
          site: 'Flipkart',
          title,
          price,
          url: link,
          availability
        });
      }
    });

    console.log("Flipkart results:", results.length);
    return results;
  } catch (error) {
    console.error(`Flipkart Scraper Error for ${productName}:`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeFlipkart;

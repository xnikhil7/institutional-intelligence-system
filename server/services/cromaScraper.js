const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const priceParser = require('../utils/priceParser');

const scrapeCroma = async (productName) => {
  const url = `https://www.croma.com/searchB?q=${encodeURIComponent(productName)}%3Arelevance&text=${encodeURIComponent(productName)}`;
  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    
    // Croma is heavily JS dependent, might need more time or specific waiting
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
    
    const html = await page.content();
    const $ = cheerio.load(html);
    
    const results = [];
    
    $('.product-item').each((index, element) => {
      if (results.length >= 3) return false;
      
      const title = $(element).find('.product-title').text().trim();
      const priceText = $(element).find('.amount').first().text().trim();
      const relativeLink = $(element).find('a').attr('href');
      
      const outOfStock = $(element).text().toLowerCase().includes('out of stock');
      const availability = outOfStock ? 'Out of Stock' : 'In Stock';
      
      const price = priceParser(priceText);
      const link = relativeLink ? `https://www.croma.com${relativeLink}` : null;
      
      if (title && price && link) {
        results.push({
          site: 'Croma',
          title,
          price,
          url: link,
          availability
        });
      }
    });
    console.log("Croma results:", results.length);
    return results;
  } catch (error) {
    console.error(`Croma Scraper Error for ${productName}:`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = scrapeCroma;

const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeReliance(product){

 try{

  const url = `https://www.reliancedigital.in/search?q=${encodeURIComponent(product)}`;

  const {data} = await axios.get(url,{
   timeout:10000,
   headers:{
    "User-Agent":"Mozilla/5.0"
   }
  });

  const $ = cheerio.load(data);
  const results=[];

  $(".sp__product").each((i,el)=>{

   const title = $(el).find(".sp__name").text().trim();

   const priceText = $(el).find(".sp__price").text().replace(/[^\d]/g,"");

   const price = parseInt(priceText);

   const link = "https://www.reliancedigital.in" + $(el).find("a").attr("href");

   if(title && price){
    results.push({
     title,
     price,
     site:"Reliance Digital",
     link,
     availability:"In Stock"
    });
   }

  });

  return results;

 }catch(err){

  console.log("Reliance scraper failed:",err.message);
  return [];
 }

}

module.exports = scrapeReliance;
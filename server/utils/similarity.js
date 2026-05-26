const Fuse = require('fuse.js');

const similarityFilter = (userQuery, products, threshold = 0.70) => {
  if (!products || products.length === 0) return [];

  const options = {
    includeScore: true,
    keys: ['title'],
    // Lower threshold means more strict matching in fuse.js
    // A score of 0 is a perfect match, 1 is a complete mismatch
    // So if the user wants > 70% similarity, the distance/score should be <= 0.3
    threshold: 1 - threshold,
    ignoreLocation: true,
    useExtendedSearch: true
  };

  const fuse = new Fuse(products, options);
  const results = fuse.search(userQuery);

  // Return original product items that matched
  return results.map(result => result.item);
};

module.exports = similarityFilter;

const fs = require('fs');

// Read the file
let content = fs.readFileSync('App.jsx', 'utf8');

// Find all occurrences of removeFromWishlist function declarations
const regex = /const removeFromWishlist = async \(productId\) => \{[\s\S]*?\n  \};/g;
const matches = [...content.matchAll(regex)];

console.log(`Found ${matches.length} removeFromWishlist functions`);

// Keep only the first occurrence and remove duplicates
if (matches.length > 1) {
  // Remove all but the first match
  for (let i = matches.length - 1; i >= 1; i--) {
    content = content.replace(matches[i][0], '');
  }
  
  // Write back to file
  fs.writeFileSync('App.jsx', content);
  console.log('Removed duplicate functions');
}
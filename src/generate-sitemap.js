import fs from 'fs';
import path from 'path';

// --- Configuration ---
// Replace with your actual production domain
const YOUR_DOMAIN = 'https://www.yashagency.in';
const API_BASE = 'http://localhost:3002'; // Your backend API URL

async function generateSitemap() {
  console.log('Generating sitemap...');

  // 1. Fetch all products from your API
  let products = [];
  try {
    const response = await fetch(`${API_BASE}/api/products`);
    if (!response.ok) {
      throw new Error(`Failed to fetch products: ${response.statusText}`);
    }
    products = await response.json();
    console.log(`Fetched ${products.length} products.`);
  } catch (error) {
    console.error('Error fetching products:', error);
    // Exit if we can't get products, as the sitemap would be incomplete.
    process.exit(1);
  }

  // 2. Define static pages
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/products', changefreq: 'daily', priority: '0.8' },
    { url: '/login', changefreq: 'monthly', priority: '0.5' },
    { url: '/support/contact', changefreq: 'monthly', priority: '0.7' },
    { url: '/support/faq', changefreq: 'monthly', priority: '0.6' },
  ];

  // 3. Start building the XML string
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // 4. Add static pages to the sitemap
  staticPages.forEach(page => {
    sitemap += `
  <url>
    <loc>${YOUR_DOMAIN}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // 5. Add dynamic product pages to the sitemap
  products.forEach(product => {
    const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    sitemap += `
  <url>
    <loc>${YOUR_DOMAIN}/product/${slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
  });

  sitemap += `\n</urlset>`;

  // 6. Write the file to the public directory
  const sitemapPath = path.resolve('public', 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);

  console.log(`Sitemap successfully generated at ${sitemapPath}`);
}

generateSitemap();
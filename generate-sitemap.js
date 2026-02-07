import fs from "fs";
import fetch from "node-fetch";

const API_URL = "https://yashagency.in/api/products";

async function generateSitemap() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("API did not return an array of products!");
      return;
    }

    // Extract unique categories
    const categories = [...new Set(data.map(p => p.category).filter(Boolean))];

    const urls = [];

    // Home
    urls.push(`
      <url>
        <loc>https://yashagency.in/</loc>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `);

    // All products
    urls.push(`
      <url>
        <loc>https://yashagency.in/products/allcategory</loc>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
      </url>
    `);

    // Categories
    categories.forEach(cat => {
      const encoded = encodeURIComponent(cat);
      urls.push(`
        <url>
          <loc>https://yashagency.in/products/${encoded}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `);
    });

    // Products
    data.forEach(product => {
      urls.push(`
        <url>
          <loc>https://yashagency.in/product/${product._id}</loc>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `);
    });

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

    fs.writeFileSync("./public/sitemap.xml", sitemapContent.trim());
    console.log("✅ sitemap.xml generated successfully!");
    
  } catch (error) {
    console.error("❌ Error generating sitemap:", error);
  }
}

generateSitemap();

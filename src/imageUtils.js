/**
 * --- Image CDN Configuration ---
 * Replace 'your-cloud-name' with your actual Cloudinary cloud name.
 * This is the central point for managing your image CDN. You can find it on your Cloudinary dashboard.
 */
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
const CLOUDINARY_FETCH_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch`;

/**
 * Generates a robust, optimized image URL using a real CDN (Cloudinary).
 * This function takes an original image URL (e.g., from Google Cloud Storage) and
 * transforms it into a Cloudinary "fetch" URL with on-the-fly optimization parameters.
 *
 * IMPORTANT: You must add 'storage.googleapis.com' to your "Allowed fetch domains" in your
 * Cloudinary account settings for this to work.
 *
 * @param {string} originalUrl The original URL of the image.
 * @param {{format?: 'webp' | 'avif' | 'auto', width?: number, quality?: 'auto' | number, crop?: 'fill' | 'fit' | 'limit'}} options
 * @returns {string} The new image URL.
 */
export const getOptimizedImageUrl = (originalUrl, { format, width, quality, crop }) => {
  if (!originalUrl || CLOUDINARY_CLOUD_NAME === 'your-cloud-name') {
    // Fallback to the original URL if not configured or if the URL is missing.
    return originalUrl || '';
  }

  // Only apply transformations to Google Cloud Storage URLs.
  // You can add other domains here if needed in the future.
  if (!originalUrl.includes('storage.googleapis.com')) {
    return originalUrl;
  }

  const transformations = [];

  // Crop mode: 'c_limit' resizes without exceeding original dimensions. 'c_fill' crops to fit.
  if (width) {
    transformations.push(`c_${crop || 'limit'}`);
  }

  // Add width transformation.
  if (width) {
    transformations.push(`w_${width}`);
  }

  // Add format transformation. 'f_auto' lets Cloudinary choose the best format.
  transformations.push(`f_${format || 'auto'}`);

  // Add quality transformation. 'q_auto' lets Cloudinary find the best quality-compression balance.
  transformations.push(`q_${quality || 'auto'}`);

  // Encode the original URL to make it safe to use inside another URL.
  const encodedUrl = encodeURIComponent(originalUrl);

  return `${CLOUDINARY_FETCH_URL}/${transformations.join(',')}/${encodedUrl}`;
};
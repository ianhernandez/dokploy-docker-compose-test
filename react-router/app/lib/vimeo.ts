/**
 * Generate a Vimeo embed URL for use in iframes
 * @param vimeoId - The Vimeo video ID
 * @returns The embed URL for the video
 */
export function generateVimeoEmbedUrl(vimeoId: string): string {
  // Extract video ID if a full URL is provided
  const videoId = extractVimeoId(vimeoId) || vimeoId;
  return `https://player.vimeo.com/video/${videoId}`;
}

/**
 * Generate a Vimeo page URL for direct links to the video
 * @param vimeoId - The Vimeo video ID
 * @returns The direct page URL for the video
 */
export function generateVimeoPageUrl(vimeoId: string): string {
  // Extract video ID if a full URL is provided
  const videoId = extractVimeoId(vimeoId) || vimeoId;
  return `https://vimeo.com/${videoId}`;
}

/**
 * Generate a Vimeo thumbnail URL
 * @param vimeoId - The Vimeo video ID
 * @param size - Thumbnail size (default: 'large')
 * @returns The thumbnail URL for the video
 */
export function generateVimeoThumbnailUrl(vimeoId: string, size: 'small' | 'medium' | 'large' = 'large'): string {
  // Extract video ID if a full URL is provided
  const videoId = extractVimeoId(vimeoId) || vimeoId;
  // Note: This is a basic implementation. For production, you might want to fetch
  // the actual thumbnail URL from Vimeo's API
  return `https://vumbnail.com/${videoId}_${size}.jpg`;
}

/**
 * Extract Vimeo ID from various Vimeo URL formats
 * @param url - The Vimeo URL
 * @returns The video ID or null if not found
 */
export function extractVimeoId(url: string): string | null {
  const patterns = [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w-]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w-]+\/videos\/(\d+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Check if a string is a valid Vimeo ID (numeric)
 * @param vimeoId - The potential Vimeo ID
 * @returns Whether the ID is valid
 */
export function isValidVimeoId(vimeoId: string): boolean {
  return /^\d+$/.test(vimeoId);
}

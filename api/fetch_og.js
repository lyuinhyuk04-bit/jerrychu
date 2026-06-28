module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ success: false, error: 'URL parameter is missing.' });
  }

  try {
    let targetUrl = url;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'https://' + targetUrl;
    }

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch target URL. Status: ${response.status}`);
    }

    const html = await response.text();

    // Helper function to extract meta tag content
    const extractMetaContent = (htmlText, propertyName) => {
      const regex1 = new RegExp(`<meta[^>]*property=["']${propertyName}["'][^>]*content=["']([^"']*)["']`, 'i');
      const regex2 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${propertyName}["']`, 'i');
      const regex3 = new RegExp(`<meta[^>]*name=["']${propertyName}["'][^>]*content=["']([^"']*)["']`, 'i');
      const regex4 = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${propertyName}["']`, 'i');

      const match = htmlText.match(regex1) || htmlText.match(regex2) || htmlText.match(regex3) || htmlText.match(regex4);
      return match ? match[1] : '';
    };

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text) => {
      return text
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&#x2F;/g, '/');
    };

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const fallbackTitle = titleMatch ? titleMatch[1] : '';

    const rawTitle = extractMetaContent(html, 'og:title') || fallbackTitle || '제목 없음';
    const rawImage = extractMetaContent(html, 'og:image') || '';
    const rawDescription = extractMetaContent(html, 'og:description') || extractMetaContent(html, 'description') || '';

    return res.status(200).json({
      success: true,
      data: {
        title: decodeHtmlEntities(rawTitle.trim()),
        image: rawImage.trim(),
        description: decodeHtmlEntities(rawDescription.trim()),
        url: targetUrl
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

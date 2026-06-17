const fs = require('fs');
const path = require('path');

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Content-Type', 'application/json');

  try {
    // Default member details (fallback if config.json does not exist)
    let members = {
      "jerrychu": { "name": "제리츄", "soopId": "rariruro" }
    };

    // Read config.json from project root if it exists
    const configPath = path.join(process.cwd(), 'config.json');
    if (fs.existsSync(configPath)) {
      try {
        const configContent = fs.readFileSync(configPath, 'utf8');
        const config = JSON.parse(configContent);
        if (config.members) {
          members = config.members;
        }
      } catch (e) {
        console.error("Failed to parse config.json", e);
      }
    }

    // Parallel async fetch for all members
    const fetchPromises = Object.entries(members).map(async ([key, m]) => {
      const soopId = m.soopId;
      if (!soopId) {
        return {
          member: key,
          name: m.name || "",
          is_live: false,
          profile_image: "",
          broad_title: "SOOP ID 없음",
          url: "#"
        };
      }

      const url = `https://bjapi.afreecatv.com/api/${soopId}/station`;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          }
        });
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        
        // Check if broadcasting
        const broad = data.broad || {};
        const isLive = broad.is_broading === true || broad.broad_no > 0;
        return {
          member: key,
          name: m.name || data.station.user_nick || "",
          is_live: isLive,
          profile_image: data.station?.user_profile_w || "",
          broad_title: broad.broad_title || "",
          url: `https://play.sooplive.com/${soopId}/${broad.broad_no || ""}`
        };
      } catch (err) {
        return {
          member: key,
          name: m.name || "",
          is_live: false,
          profile_image: "",
          broad_title: "API 에러",
          url: "#"
        };
      }
    });

    const results = await Promise.all(fetchPromises);
    return res.status(200).json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/*
[SOOP API Response Template Reference]
{
    "result": 1,
    "msg": "Success",
    "data": {
        "rtmp": "rtmp://stream.sooplive.com/app/",
        "key": "afid-1234567",
        "data": {
            "title": "nickname`s SOOP stream",
            "category": "00000000",
            "language": "ko_KR",
            "allowed_view_cnt": 100000,
            "is_password": 0,
            "broad_hidden": 0,
            "broad_grade": 0,
            "hashtags": "",
            "broad_ending_msg": "",
            "is_wait": 0,
            "waiting_time": 10,
            "water_mark": 1,
            "broad_tune_out": 1,
            "paid_promotion": 0
        }
    }
}
*/

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
        
        // Check if broadcasting (Support both legacy BJ api and new SOOP stream info api)
        let isLive = false;
        let title = "";
        let profileImage = data.station?.user_profile_w || "";
        let stationName = m.name || (data.station && data.station.user_nick) || "";
        let playUrl = `https://play.sooplive.com/${soopId}`;

        // 1. New SOOP stream API formatting support (as requested)
        if (data.result === 1 && data.data && data.data.rtmp) {
          isLive = true; // Active streaming with valid RTMP keys
          const innerData = data.data.data || {};
          title = innerData.title || "";
        } else {
          // 2. Legacy BJ station API formatting fallback
          const broad = data.broad || {};
          isLive = broad.is_broading === true || broad.broad_no > 0;
          title = broad.broad_title || "";
          if (data.station) {
            stationName = m.name || data.station.user_nick || "";
          }
          if (broad.broad_no) {
            playUrl = `https://play.sooplive.com/${soopId}/${broad.broad_no}`;
          }
        }

        return {
          member: key,
          name: stationName,
          is_live: isLive,
          profile_image: profileImage,
          broad_title: title,
          url: playUrl
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

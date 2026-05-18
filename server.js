const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ success: true, message: "SnapFetch API Running" });
});

app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL required" });

    const APP_ROOT = process.cwd();
    const cookieFile = path.resolve(APP_ROOT, "cookies/instagram.txt");

    console.log("[DEBUG] URL:", url);
    console.log("[DEBUG] Cookie size:", fs.existsSync(cookieFile) ? fs.statSync(cookieFile).size : 0);

    let metadata = null;
    try {
      metadata = await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificates: true,
        ignoreErrors: true,
        cookies: cookieFile,
        addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"],
        extractorArgs: { instagram: ["api_version=v1", "include_logged_in=true", "variant=android"] },
        extractorRetries: 5,
        retrySleep: 3,
      });
      console.log("[SUCCESS] Metadata extracted");
    } catch (extractErr) {
      console.error("[yt-dlp FAILED]", extractErr.message || extractErr);
      return res.status(500).json({
        success: false,
        error: "Metadata extraction failed",
        details: extractErr.message || "Unknown yt-dlp error"
      });
    }

    if (!metadata) {
      return res.status(500).json({ success: false, error: "Empty metadata" });
    }

    console.log("Metadata Keys:", Object.keys(metadata));

    // ... (image extraction logic)
    let items = [];

    if (metadata.entries?.length > 0) {
      items = metadata.entries.map(item => ({
        type: "image",
        url: item.url || item.display_url || item.image_versions2?.candidates?.[0]?.url || null,
        thumbnail: item.thumbnail || item.display_url || null
      }));
    } else if (metadata.image_versions2?.candidates?.length > 0) {
      const best = [...metadata.image_versions2.candidates].sort((a, b) => (b.width || 0) - (a.width || 0))[0];
      items.push({ type: "image", url: best?.url, thumbnail: best?.url });
    } else if (metadata.display_resources?.length > 0) {
      items = metadata.display_resources.map(img => ({
        type: "image", url: img.src || img.url, thumbnail: img.src || img.url
      }));
    } else if (metadata.thumbnail) {
      items.push({ type: "image", url: metadata.thumbnail, thumbnail: metadata.thumbnail });
    }

    if (items.length === 0) {
      return res.status(404).json({ success: false, error: "No media found" });
    }

    return res.json({
      success: true,
      platform: "instagram",
      title: metadata.title || "Instagram Post",
      thumbnail: metadata.thumbnail,
      items: items,
      download: items[0]?.url || null,
      isCarousel: items.length > 1
    });

  } catch (err) {
    console.error("[CRITICAL ERROR]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
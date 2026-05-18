const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

dotenv.config();

const app = express();   // ← MUST be at the top, before any routes

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "SnapFetch API Running"
  });
});

app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL required" });
    }

    const APP_ROOT = process.cwd();
    const COOKIE_FILES = {
      instagram: path.resolve(APP_ROOT, "cookies/instagram.txt"),
      facebook: path.resolve(APP_ROOT, "cookies/facebook.txt"),
      youtube: path.resolve(APP_ROOT, "cookies/youtube.txt"),
    };

    const cookieFile = /instagram\.com|instagr\.am/i.test(url)
      ? COOKIE_FILES.instagram
      : /facebook\.com|fb\.watch/i.test(url)
      ? COOKIE_FILES.facebook
      : COOKIE_FILES.youtube;

    console.log("[yt-dlp] url:", url);
    console.log("[yt-dlp] cookieFile:", cookieFile);
    console.log("[yt-dlp] exists:", fs.existsSync(cookieFile));
    console.log("[yt-dlp] size:", fs.existsSync(cookieFile) ? fs.statSync(cookieFile).size : 0);

    const metadata = await youtubedl(url, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      ignoreErrors: true,
      cookies: cookieFile,
      addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"],
      extractorArgs: {
        instagram: ["api_version=v1", "include_logged_in=true", "variant=android", "variant=ios"]
      },
      extractorRetries: 5,
      retrySleep: 3,
      format: "bestvideo+bestaudio/best",
    });

    console.log("[yt-dlp] extraction success");

    if (!metadata) {
      return res.status(500).json({ success: false, error: "Metadata extraction failed" });
    }

    const formats = metadata.formats || [];
    const bestVideo = formats.find(f => f.url && (f.ext === "mp4" || f.vcodec !== "none")) || null;

    let items = [];

    if (metadata.entries?.length > 0) {
      items = metadata.entries.map(item => ({
        type: (item.ext === "mp4" || item.video_url || item.playable_url) ? "video" : "image",
        url: item.url || item.video_url || item.playable_url || item.display_url ||
             item.image_versions2?.candidates?.[0]?.url || item.display_resources?.[0]?.src || null,
        thumbnail: item.thumbnail || item.display_url || item.image_versions2?.candidates?.[0]?.url || null
      }));
    } else if (metadata.image_versions2?.candidates?.length > 0) {
      const candidates = [...metadata.image_versions2.candidates].sort((a, b) => (b.width || 0) - (a.width || 0));
      items.push({ type: "image", url: candidates[0]?.url, thumbnail: candidates[0]?.url });
    } else if (metadata.display_resources?.length > 0) {
      items = metadata.display_resources.map(img => ({
        type: "image",
        url: img.src || img.url,
        thumbnail: img.src || img.url
      }));
    } else if (metadata.thumbnail || metadata.display_url) {
      items.push({
        type: "image",
        url: metadata.thumbnail || metadata.display_url,
        thumbnail: metadata.thumbnail || metadata.display_url
      });
    }

    if (!bestVideo && items.length === 0) {
      return res.status(404).json({ success: false, error: "No downloadable media found" });
    }

    return res.json({
      success: true,
      platform: metadata.extractor || null,
      title: metadata.title || null,
      thumbnail: metadata.thumbnail || null,
      items: items,
      download: bestVideo?.url || items[0]?.url || null,
      isCarousel: items.length > 1,
      formats: formats.map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.height || f.format_note,
        width: f.width,
        height: f.height,
        filesize: f.filesize,
        url: f.url,
        has_audio: f.acodec !== "none"
      }))
    });

  } catch (err) {
    console.error("[yt-dlp ERROR]", err);
    return res.status(500).json({
      success: false,
      error: err.stderr || err.message || "Download failed"
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
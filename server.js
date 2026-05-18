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
  res.json({
    success: true,
    message: "SnapFetch API Running"
  });
});

app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL required"
      });
    }

    const APP_ROOT = process.cwd();

    const COOKIE_FILES = {
      instagram: path.resolve(
        APP_ROOT,
        "cookies/instagram.txt"
      ),

      facebook: path.resolve(
        APP_ROOT,
        "cookies/facebook.txt"
      ),

      youtube: path.resolve(
        APP_ROOT,
        "cookies/youtube.txt"
      )
    };

    const cookieFile =
      /instagram\.com|instagr\.am/i.test(url)
        ? COOKIE_FILES.instagram
        : /facebook\.com|fb\.watch/i.test(url)
        ? COOKIE_FILES.facebook
        : COOKIE_FILES.youtube;

    console.log(
      "[yt-dlp] cwd:",
      process.cwd()
    );

    console.log(
      "[yt-dlp] cookieFile:",
      cookieFile,
      "exists:",
      fs.existsSync(cookieFile),
      "size:",
      fs.existsSync(cookieFile)
        ? fs.statSync(cookieFile).size
        : 0
    );

    const metadata = await youtubedl(url, {
      dumpSingleJson: true,

      noWarnings: true,

      noCheckCertificates: true,

      preferFreeFormats: true,

      cookies: cookieFile,

      addHeader: [
        "User-Agent: Mozilla/5.0"
      ],

      extractorArgs: [
        "instagram:api_version=v1"
      ],

      extractorRetries: 5,

      format:
        "bestvideo+bestaudio/best"
    });

    console.log(
      "[yt-dlp] using cookies:",
      cookieFile
    );

    const formats = metadata.formats || [];

    const bestVideo =
      formats
        .filter(
          f => f.ext === "mp4" && f.url
        )
        .sort(
          (a, b) =>
            (b.height || 0) -
            (a.height || 0)
        )[0] ||
      formats.find(f => f.url);

    if (!bestVideo) {
      return res.status(404).json({
        success: false,
        error:
          "No downloadable media found"
      });
    }

    return res.json({
      success: true,

      platform:
        metadata.extractor || null,

      title:
        metadata.title || null,

      description:
        metadata.description || "",

      tags: metadata.tags || [],

      thumbnail:
        metadata.thumbnail || null,

      thumbnail_hd:
        metadata.thumbnail ||
        (metadata.thumbnails?.length
          ? metadata.thumbnails[
              metadata.thumbnails.length - 1
            ].url
          : null),

      thumbnails:
        metadata.thumbnails || [],

      display_resources:
        metadata.display_resources || [],

      duration:
        metadata.duration || null,

      formats:
        formats.map(f => ({
          format_id: f.format_id,

          ext: f.ext,

          quality:
            f.height ||
            f.format_note ||
            null,

          width: f.width || null,

          height:
            f.height || null,

          filesize:
            f.filesize || null,

          url: f.url,

          has_audio:
            f.acodec !== "none"
        })),

      items:
        metadata.entries?.map(item => ({
          type:
            item.ext === "jpg"
              ? "image"
              : "video",

          url: item.url,

          thumbnail:
            item.thumbnail || null
        })) || [],

      download: bestVideo.url
    });

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});
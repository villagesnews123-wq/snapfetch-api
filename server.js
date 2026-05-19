const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

const youtubeTranscript =
  require("./routes/youtubeTranscript");

const audioToText =
  require("./routes/audioToText");

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

    const isInstagram =
      /instagram\.com|instagr\.am/i.test(url);

    const isFacebook =
      /facebook\.com|fb\.watch/i.test(url);

    const isYoutube =
      /youtube\.com|youtu\.be/i.test(url);

    const cookieFile =
      isInstagram
        ? COOKIE_FILES.instagram
        : isFacebook
        ? COOKIE_FILES.facebook
        : COOKIE_FILES.youtube;

    console.log("[yt-dlp] url:", url);

    const options = {

      dumpSingleJson: true,

      noWarnings: true,

      noCheckCertificates: true,

      preferFreeFormats: true,

      ignoreErrors: true,

      addHeader: [
        "User-Agent: Mozilla/5.0"
      ],

      extractorRetries: 3,

      retrySleep: 2,

      format:
        "bestvideo+bestaudio/best"

    };

    // Only apply cookies if file exists
    if (
      cookieFile &&
      fs.existsSync(cookieFile)
    ) {

      options.cookies = cookieFile;

    }

    // ONLY Instagram gets extractorArgs
    if (isInstagram) {

      options.extractorArgs = [
        "instagram:api_version=v1",
        "instagram:include_logged_in=true",
        "instagram:variant=android"
      ];

    }

    const metadata =
      await youtubedl(url, options);

    console.log(
      "[yt-dlp] extraction success"
    );

    if (!metadata) {

      return res.status(500).json({
        success: false,
        error: "Metadata extraction failed"
      });

    }

    const formats =
      metadata.formats || [];

    const bestVideo =
      formats.find(
        f =>
          f.url &&
          (
            f.ext === "mp4" ||
            f.vcodec !== "none"
          )
      ) || formats[0];

    if (!bestVideo?.url) {

      return res.status(404).json({
        success: false,
        error:
          "No downloadable video found"
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

      thumbnail:
        metadata.thumbnail || null,

      duration:
        metadata.duration || null,

      uploader:
        metadata.uploader || null,

      view_count:
        metadata.view_count || null,

      like_count:
        metadata.like_count || null,

      formats:
        formats.map(f => ({

          format_id: f.format_id,

          ext: f.ext,

          quality:
            f.height ||
            f.format_note ||
            null,

          width:
            f.width || null,

          height:
            f.height || null,

          filesize:
            f.filesize || null,

          url: f.url,

          has_audio:
            f.acodec !== "none"

        })),

      items: [
        {
          type: "video",

          url: bestVideo.url,

          thumbnail:
            metadata.thumbnail || null
        }
      ],

      download:
        bestVideo.url || null,

      isCarousel: false

    });

  } catch (err) {

    console.error(
      "[yt-dlp ERROR]",
      err
    );

    return res.status(500).json({

      success: false,

      error:
        err.stderr ||
        err.message ||
        "Download failed"

    });

  }

});

app.use(
  "/youtube-transcript",
  youtubeTranscript
);

app.use(
  "/audio-to-text",
  audioToText
);

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on port ${PORT}`
  );

});
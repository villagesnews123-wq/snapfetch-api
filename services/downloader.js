const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

module.exports = async function downloadMedia(url) {

  const APP_ROOT = process.cwd();

  const COOKIE_FILES = {
    instagram: path.join(APP_ROOT, "cookies", "instagram.txt"),
    facebook: path.join(APP_ROOT, "cookies", "facebook.txt"),
    youtube: path.join(APP_ROOT, "cookies", "youtube.txt")
  };

  const isInstagram = /instagram\.com|instagr\.am/i.test(url);
  const isFacebook = /facebook\.com|fb\.watch/i.test(url);
  const isYoutube = /youtube\.com|youtu\.be/i.test(url);

  let cookieFile = null;

  if (isInstagram) {
    cookieFile = COOKIE_FILES.instagram;
  } else if (isFacebook) {
    cookieFile = COOKIE_FILES.facebook;
  } else if (isYoutube) {
    cookieFile = COOKIE_FILES.youtube;
  }

  console.log("================================");
  console.log("Platform:",
    isInstagram ? "Instagram" :
    isFacebook ? "Facebook" :
    isYoutube ? "YouTube" :
    "Other");
  console.log("URL:", url);
  console.log("Cookie:", cookieFile);
  console.log("Cookie Exists:", cookieFile ? fs.existsSync(cookieFile) : false);
  console.log("================================");

  const options = {

    dumpSingleJson: true,

    noWarnings: true,

    noCheckCertificates: true,

    ignoreErrors: false,

    extractorRetries: 10,

    retrySleep: 5,

    socketTimeout: 60,

    preferFreeFormats: true,

    format: "best",

    addHeader: [
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36"
    ]

  };

  if (cookieFile && fs.existsSync(cookieFile)) {
    options.cookies = cookieFile;
  }

  // IMPORTANT:
  // Do NOT use extractorArgs for Instagram.
  // They break many recent Instagram downloads.

  console.log("Running yt-dlp with options:");
console.log(options);

const metadata = await youtubedl(url, options);

console.log("Metadata loaded successfully");

  if (!metadata) {
    throw new Error("Unable to fetch media.");
  }

  const formats = metadata.formats || [];

  const bestVideo =
    formats.find(f => f.url && f.vcodec !== "none") ||
    formats.find(f => f.url) ||
    formats[0];

  if (!bestVideo) {
    throw new Error("No downloadable format found.");
  }

  return {

    success: true,

    platform: metadata.extractor,

    title: metadata.title,

    description: metadata.description || "",

    thumbnail: metadata.thumbnail,

    duration: metadata.duration,

    uploader: metadata.uploader,

    view_count: metadata.view_count,

    like_count: metadata.like_count,

    download: bestVideo.url,

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

  };

};
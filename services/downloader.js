const youtubedl = require("youtube-dl-exec");
const fs = require("fs");
const path = require("path");

module.exports = async function downloadMedia(url) {
  const APP_ROOT = process.cwd();

  const COOKIE_FILES = {
    instagram: path.join(APP_ROOT, "cookies", "instagram.txt"),
    facebook: path.join(APP_ROOT, "cookies", "facebook.txt"),
    youtube: path.join(APP_ROOT, "cookies", "youtube.txt"),
    twitter: path.join(APP_ROOT, "cookies", "twitter.txt"),
    linkedin: path.join(APP_ROOT, "cookies", "linkedin.txt"),
    pinterest: path.join(APP_ROOT, "cookies", "pinterest.txt"),
  };

  const isInstagram = /instagram\.com|instagr\.am/i.test(url);
  const isFacebook = /facebook\.com|fb\.watch/i.test(url);
  const isYoutube = /youtube\.com|youtu\.be/i.test(url);
  const isTwitter = /twitter\.com|x\.com/i.test(url);
  const isLinkedIn = /linkedin\.com/i.test(url);
  const isPinterest = /pinterest\.com/i.test(url);

  let cookieFile = null;

  if (isInstagram) {
    cookieFile = COOKIE_FILES.instagram;
  } else if (isFacebook) {
    cookieFile = COOKIE_FILES.facebook;
  } else if (isYoutube) {
    cookieFile = COOKIE_FILES.youtube;
  } else if (isTwitter) {
    cookieFile = COOKIE_FILES.twitter;
  } else if (isLinkedIn) {
    cookieFile = COOKIE_FILES.linkedin;
  } else if (isPinterest) {
    cookieFile = COOKIE_FILES.pinterest;
  }

  console.log("");
  console.log("========================================");
  console.log(
    "Platform :",
    isInstagram
      ? "Instagram"
      : isFacebook
      ? "Facebook"
      : isYoutube
      ? "YouTube"
      : isTwitter
      ? "Twitter"
      : isLinkedIn
      ? "LinkedIn"
      : isPinterest
      ? "Pinterest"
      : "Other"
  );
  console.log("URL      :", url);
  console.log("Cookie   :", cookieFile);
  console.log("Exists   :", cookieFile ? fs.existsSync(cookieFile) : false);
  console.log("========================================");
  console.log("");

  const options = {
    dumpSingleJson: true,

    noWarnings: true,
    noCheckCertificates: true,

    ignoreErrors: false,

    extractorRetries: 10,

    retrySleep: "5",

    socketTimeout: 60,

    // Platform-specific format selection
    format: isYoutube
      ? "bestvideo+bestaudio/best"
      : "bv*+ba/b",

    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36",
  };

  if (cookieFile && fs.existsSync(cookieFile)) {
    options.cookies = cookieFile;
  }

  console.log("Running yt-dlp...");
  console.log(options);

  let metadata;

  try {
    metadata = await youtubedl(url, options);
    console.log("Metadata loaded successfully.");
  } catch (err) {
    console.log("============== YT-DLP ERROR ==============");

    if (err.stdout) console.log(err.stdout);

    if (err.stderr) console.log(err.stderr);

    console.log(err);

    console.log("==========================================");

    throw err;
  }

  if (!metadata) {
    throw new Error("Unable to fetch media.");
  }

  const formats = metadata.formats || [];

  const bestVideo =
    formats.find(
      (f) =>
        f.url &&
        f.vcodec !== "none" &&
        f.acodec !== "none"
    ) ||
    formats.find(
      (f) =>
        f.url &&
        f.vcodec !== "none"
    ) ||
    formats.find((f) => f.url);

  if (!bestVideo) {
    throw new Error("No downloadable format found.");
  }

  return {
    success: true,

    platform: metadata.extractor || "",

    title: metadata.title || "",

    description: metadata.description || "",

    thumbnail: metadata.thumbnail || "",

    duration: metadata.duration || 0,

    uploader: metadata.uploader || "",

    view_count: metadata.view_count || 0,

    like_count: metadata.like_count || 0,

    download: bestVideo.url,

    formats: formats.map((f) => ({
      format_id: f.format_id,
      ext: f.ext,
      quality: f.height || f.format_note,
      width: f.width,
      height: f.height,
      filesize: f.filesize,
      has_audio: f.acodec !== "none",
      url: f.url,
    })),
  };
};
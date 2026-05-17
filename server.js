const express = require("express");
const cors = require("cors");
const dotenv = require("youtube-dl-exec");
const youtubedl = ;

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

    const metadata = await ytDlpWrap.getVideoInfo(url);

    const formats = metadata.formats || [];

    const bestVideo =
      formats.find(f => f.ext === "mp4" && f.url) ||
      formats.find(f => f.url);

    if (!bestVideo) {
      return res.status(404).json({
        success: false,
        error: "No downloadable media found"
      });
    }

    return res.json({
      success: true,
      title: metadata.title,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      platform: metadata.extractor,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
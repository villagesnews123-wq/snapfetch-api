const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const router = express.Router();

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/",
  upload.single("audio"),
  async (req, res) => {

    try {

      if (!process.env.GROQ_API_KEY) {

        return res.status(500).json({
          success: false,
          error: "GROQ_API_KEY not configured."
        });

      }

      if (!req.file) {

        return res.status(400).json({
          success: false,
          error: "Audio file required."
        });

      }

      const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });

      const filePath = path.resolve(req.file.path);

      const result =
        await groq.audio.transcriptions.create({

          file: fs.createReadStream(filePath),

          model: "whisper-large-v3-turbo",

          response_format: "verbose_json",

          language: "en",

          temperature: 0

        });

      fs.unlinkSync(filePath);

      return res.json({

        success: true,

        text: result.text

      });

    } catch (err) {

      console.error(err);

      return res.status(500).json({

        success: false,

        error: err.message

      });

    }

  }
);

module.exports = router;
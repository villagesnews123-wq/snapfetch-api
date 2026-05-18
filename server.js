app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL required" });

    const APP_ROOT = process.cwd();
    const cookieFile = path.resolve(APP_ROOT, "cookies/instagram.txt");

    console.log("[DEBUG] URL:", url);
    console.log("[DEBUG] Cookie exists:", fs.existsSync(cookieFile));

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
      console.log("[SUCCESS] Metadata received");
    } catch (extractErr) {
      console.error("[yt-dlp FAILED]", extractErr.message || extractErr);
      return res.status(500).json({ 
        success: false, 
        error: "Metadata extraction failed",
        details: extractErr.message 
      });
    }

    if (!metadata) {
      return res.status(500).json({ success: false, error: "Empty metadata" });
    }

    // ... (rest of your extraction logic - items, bestVideo, etc.)

    console.log("Metadata keys:", Object.keys(metadata));

    // Keep your existing items extraction logic here...

    return res.json({
      success: true,
      platform: "instagram",
      title: metadata.title || "Instagram Post",
      thumbnail: metadata.thumbnail,
      items: items || [],
      download: null,
      isCarousel: false
    });

  } catch (err) {
    console.error("[CRITICAL ERROR]", err.message);
    return res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});
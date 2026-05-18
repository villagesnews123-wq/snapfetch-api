app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, error: "URL required" });

    const APP_ROOT = process.cwd();
    const cookieFile = path.resolve(APP_ROOT, "cookies/instagram.txt");

    console.log("[DEBUG] URL:", url);

    let metadata = null;
    try {
      metadata = await youtubedl(url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificates: true,
        ignoreErrors: true,
        cookies: cookieFile,
        addHeader: ["User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)"],
        extractorArgs: { instagram: ["api_version=v1", "include_logged_in=true", "variant=android", "variant=ios"] },
        extractorRetries: 10,
        retrySleep: 5,
      });
    } catch (e) {
      console.error("[yt-dlp Error]", e.message);
    }

    if (!metadata) {
      return res.status(500).json({ success: false, error: "Metadata extraction failed" });
    }

    console.log("✅ Metadata Keys:", Object.keys(metadata));

    let items = [];

    // Strong Carousel & Photo Handling
    if (metadata.entries?.length > 0) {
      items = metadata.entries.map(item => ({
        type: "image",
        url: item.url || item.display_url || item.image_versions2?.candidates?.[0]?.url || null,
        thumbnail: item.thumbnail || null
      }));
    } else if (metadata.sidecar_children?.length > 0) {
      items = metadata.sidecar_children.map(item => ({
        type: "image",
        url: item.image_versions2?.candidates?.[0]?.url || item.display_url,
        thumbnail: item.image_versions2?.candidates?.[0]?.url
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

    const formats = metadata.formats || [];
    const bestVideo = formats.find(f => f.url) || null;

    if (items.length === 0 && !bestVideo) {
      return res.status(404).json({ success: false, error: "No media found" });
    }

    return res.json({
      success: true,
      platform: "instagram",
      title: metadata.title || "Instagram Post",
      thumbnail: metadata.thumbnail,
      items: items.length > 0 ? items : [{ type: "video", url: bestVideo?.url }],
      download: bestVideo?.url || items[0]?.url || null,
      isCarousel: items.length > 1
    });

  } catch (err) {
    console.error("[ERROR]", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});
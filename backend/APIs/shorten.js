import exp from "express"
import { shortCodeGenerator } from "../utils/shortCodeGenerator.js"
import { urlModel } from "../models/urls.js"
import { authMiddleware } from "../middleware/auth.js"

export const shortApp=exp.Router()

shortApp.post('/shorten', authMiddleware, async (req, res) => {
  try {
    let { originalUrl, expiresAt } = req.body;
    if (!originalUrl || typeof originalUrl !== "string") {
      return res.status(400).json({ message: "URL is required" });
    }
    let parsedUrl;
    try {
      parsedUrl = new URL(originalUrl);
    } catch {
      return res.status(400).json({ message: "Invalid URL format" });
    }
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return res.status(400).json({ message: "Only HTTP/HTTPS URLs allowed" });
    }

    let expiresAtDate;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
      if (isNaN(expiresAtDate.getTime())) {
        return res.status(400).json({ message: "Invalid expiration date format" });
      }
      if (expiresAtDate <= new Date()) {
        return res.status(400).json({ message: "Expiration date must be in the future" });
      }
    }

    let shortCode = shortCodeGenerator();

    let urlDoc = new urlModel({ 
      originalUrl, 
      shortCode, 
      userId: req.userId,
      expiresAt: expiresAtDate
    });
    await urlDoc.save();

    const baseUrl = process.env.BASE_URL || "http://localhost:5000";

    res.status(200).json({
      message: "created url",
      shortUrl: `${baseUrl}/${shortCode}`,
      urlDetails: urlDoc
    });

  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Error", payload: err });
  }
});

shortApp.get('/my-urls', authMiddleware, async (req, res) => {
  try {
    const urls = await urlModel.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.status(200).json({
      message: "Retrieved user URLs",
      payload: urls
    });
  } catch (err) {
    console.error("Error fetching user URLs:", err);
    res.status(500).json({ message: "Error retrieving URLs", payload: err.message });
  }
});

shortApp.get('/stats/:shortCode', authMiddleware, async (req, res) => {
  try {
    const { shortCode } = req.params;

    const doc = await urlModel.findOne({ shortCode });

    if (!doc) {
      return res.status(404).json({ message: "Short URL not found" });
    }

    if (doc.userId && doc.userId.toString() !== req.userId) {
      return res.status(403).json({ message: "Access denied. You do not own this link." });
    }

    res.status(200).json({
      originalUrl: doc.originalUrl,
      clicks: doc.clicks,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt
    });

  } catch (err) {
    res.status(400).json({ message: "Error", payload: err });
  }
});

// shortApp.get('/:shortCode', async (req,res)=>{
//     try{
//     let shortCode=req.params.shortCode
//     let originalUrl= await urlModel.findOneAndUpdate({shortCode} , { $inc: { clicks: 1 } }, { new: true } )
    
//     res.status(200).json({message:"OriginalURL",payload:originalUrl})
//     }
//     catch(err){
//         res.status(400).json({message:"Error",payload:err})
//     }
// })



shortApp.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const doc = await urlModel.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } },
      { returnDocument: "after" }
    );

    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (!doc) {
      return res.redirect(`${clientUrl}?error=not_found`);
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      return res.redirect(`${clientUrl}?error=expired`);
    }

    return res.redirect(doc.originalUrl);

  } catch (err) {
    return res.status(400).json({
      message: "Error",
      payload: err
    });
  }
});

// shortApp.get('/:shortCode', async (req, res) => {
//   try {
//     const { shortCode } = req.params;

//     const doc = await urlModel.findOneAndUpdate(
//       { shortCode },
//       { $inc: { clicks: 1 } },
//       { returnDocument: "after" }
//     );

//     if (!doc) {
//       return res.status(404).json({ message: "Short URL not found" });
//     }

//     // Expiry check
//     if (doc.expiresAt && doc.expiresAt < new Date()) {
//       return res.status(410).json({ message: "This link has expired" });
//     }

//     res.redirect(doc.originalUrl);

//   } catch (err) {
//     res.status(400).json({ message: "Error", payload: err });
//   }
// });


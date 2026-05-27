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

const getErrorHtml = (title, message, iconType) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  
  const iconSvg = iconType === "expired" 
    ? `<svg xmlns="http://www.w3.org/2000/svg" style="height: 48px; width: 48px; margin: 0 auto;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
       </svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" style="height: 48px; width: 48px; margin: 0 auto;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
       </svg>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | Shortify</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600&family=Space+Grotesk:wght@700&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #000000;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: #0A0A0A;
      border: 1px solid #1C1C1C;
      border-radius: 24px;
      padding: 40px;
      max-width: 450px;
      width: 100%;
      text-align: center;
      box-shadow: 0 0 40px rgba(57, 255, 20, 0.03);
    }
    .icon {
      color: #39FF14;
      margin-bottom: 20px;
    }
    h1 {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 10px 0;
      color: #ffffff;
    }
    p {
      color: #a3a3a3;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 30px 0;
    }
    .btn {
      display: inline-block;
      background-color: #39FF14;
      color: #000000;
      text-decoration: none;
      font-weight: 700;
      padding: 14px 28px;
      border-radius: 12px;
      transition: all 0.2s ease;
      font-size: 14px;
    }
    .btn:hover {
      box-shadow: 0 0 15px rgba(57, 255, 20, 0.35);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${iconSvg}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${clientUrl}" class="btn">Go to Shortify</a>
  </div>
</body>
</html>`;
};

shortApp.get('/:shortCode', async (req, res) => {
  try {
    const { shortCode } = req.params;

    const doc = await urlModel.findOneAndUpdate(
      { shortCode },
      { $inc: { clicks: 1 } },
      { returnDocument: "after" }
    );

    if (!doc) {
      res.setHeader("Content-Type", "text/html");
      return res.status(404).send(
        getErrorHtml(
          "Link Not Found",
          "The shortened link you are trying to visit does not exist. It may have been deleted, or the URL could be mistyped.",
          "not_found"
        )
      );
    }

    if (doc.expiresAt && doc.expiresAt < new Date()) {
      res.setHeader("Content-Type", "text/html");
      return res.status(410).send(
        getErrorHtml(
          "Link Expired",
          "This shortened link has reached its expiration date and is no longer active. Please contact the link creator to obtain a valid link.",
          "expired"
        )
      );
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


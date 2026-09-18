const axios = require("axios");

const API_URL = "https://anabot.my.id/api/download/tiktok";
const API_KEY = "freeApikey";

async function tiktokDownloader(url) {
    try {
        const response = await axios.get(API_URL, {
            params: {
                url: url,
                apikey: API_KEY
            },
            timeout: 45000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        return response.data;
    } catch (error) {
        console.error(
            "TikTok API Error:",
            error.response?.data || error.message
        );

        throw error;
    }
}

async function tiktokCommand(sock, chatId, message) {
    const text =
        message.message?.conversation ||
        message.message?.extendedTextMessage?.text;

    if (!text) {
        return await sock.sendMessage(chatId, {
            text: "Please provide a TikTok link for the video."
        });
    }

    const url = text.split(" ").slice(1).join(" ").trim();

    if (!url) {
        return await sock.sendMessage(chatId, {
            text: "Please provide a TikTok link for the video."
        });
    }

    const tiktokPatterns = [
        /https?:\/\/(?:www\.)?tiktok\.com\//i,
        /https?:\/\/(?:vm\.)?tiktok\.com\//i,
        /https?:\/\/(?:vt\.)?tiktok\.com\//i
    ];

    const isValidUrl = tiktokPatterns.some(pattern =>
        pattern.test(url)
    );

    if (!isValidUrl) {
        return await sock.sendMessage(chatId, {
            text: "That is not a valid TikTok link. Please provide a valid TikTok video link."
        });
    }

    try {
        await sock.sendMessage(
            chatId,
            {
                text: "⏳ Downloading TikTok video..."
            },
            { quoted: message }
        );

        const apiData = await tiktokDownloader(url);

        console.log(
            "TikTok API Response:",
            JSON.stringify(apiData, null, 2)
        );

        const result = apiData?.result || apiData?.data?.result;

        if (!result) {
            throw new Error("Invalid API response");
        }

        const videoUrl =
            result.nowatermark ||
            result.video;

        if (!videoUrl) {
            throw new Error("No downloadable video found");
        }

        // Download video as buffer
        const videoResponse = await axios.get(videoUrl, {
            responseType: "arraybuffer",
            timeout: 90000,
            headers: {
                "User-Agent": "Mozilla/5.0"
            }
        });

        const videoBuffer = Buffer.from(videoResponse.data);

        const username =
            result.username ||
            result.author?.username ||
            result.author?.nickname ||
            "Unknown";

        const description =
            result.description ||
            result.title ||
            "No caption";

        const caption = `🎵 ANDY-XMD TIKTOK *
━━━━━━━━━━━━━━━━━━━

👤 *User:* ${username}

📝 *Caption:*
${description}

✨ *Quality:* ${
            result.nowatermark
                ? "No Watermark"
                : "Standard"
        }

━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(
            chatId,
            {
                video: videoBuffer,
                mimetype: "video/mp4",
                caption: caption,
                fileName: `tiktok_${username.replace(
                    /[^a-zA-Z0-9_-]/g,
                    ""
                )}.mp4`
            },
            { quoted: message }
        );

    } catch (error) {
        console.error("TikTok command error:", error);

        await sock.sendMessage(
            chatId,
            {
                text:
                    `❌ Failed to download TikTok video.\n` +
                    `Reason: ${error.message}`
            },
            { quoted: message }
        );
    }
}

module.exports = tiktokCommand;
const { ttdl } = require("ruhend-scraper");
const axios = require('axios');



async function tiktokCommand(sock, chatId, message) {
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        
        if (!text) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a TikTok link for the video."
            });
        }

        // Extract URL from command
        const url = text.split(' ').slice(1).join(' ').trim();
        
        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a TikTok link for the video."
            });
        }

        // Check for various TikTok URL formats
        const tiktokPatterns = [
            /https?:\/\/(?:www\.)?tiktok\.com\//,
            /https?:\/\/(?:vm\.)?tiktok\.com\//,
            /https?:\/\/(?:vt\.)?tiktok\.com\//,
            /https?:\/\/(?:www\.)?tiktok\.com\/@/,
            /https?:\/\/(?:www\.)?tiktok\.com\/t\//
        ];

        const isValidUrl = tiktokPatterns.some(pattern => pattern.test(url));
        
        if (!isValidUrl) {
            return await sock.sendMessage(chatId, { 
                text: "That is not a valid TikTok link. Please provide a valid TikTok video link."
            });
        }
        try {
            await sock.sendMessage(chatId, {
                text: '⏳ Downloading TikTok video...'
            }, { quoted: message });
            const apiUrl = `https://discardapi.onrender.com/api/dl/tiktok?apikey=guru&url=${encodeURIComponent(url)}`;
            const { data } = await axios.get(apiUrl, {
                timeout: 45000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (!data?.status || !data?.result) {
                throw new Error('Invalid API response');
            }
            const res = data.result;
            const hd = res.data.find((v) => v.type === 'nowatermark_hd');
            const noWm = res.data.find((v) => v.type === 'nowatermark');
            const videoUrl = hd?.url || noWm?.url;
            if (!videoUrl) {
                throw new Error('No downloadable video found');
            }
            const caption = `🎵 *TikTok Downloader*
━━━━━━━━━━━━━━━━━━━
👤 *User:* ${res.author.nickname}
🆔 *Username:* ${res.author.fullname}
🌍 *Region:* ${res.region}
⏱️ *Duration:* ${res.duration}

❤️ *Likes:* ${res.stats.likes}
💬 *Comments:* ${res.stats.comment}
🔁 *Shares:* ${res.stats.share}
👀 *Views:* ${res.stats.views}

🎧 *Sound:* ${res.music_info.title}
📅 *Posted:* ${res.taken_at}

📝 *Caption:*
${res.title || 'No caption'}

✨ *Quality:* ${hd ? 'HD No Watermark' : 'No Watermark'}
━━━━━━━━━━━━━━━━━━━`;
            await sock.sendMessage(chatId, {
                video: { url: videoUrl },
                mimetype: 'video/mp4',
                caption
            }, { quoted: message });
        }
        catch (error) {
            console.error('TikTok plugin error:', error);
            if (error.code === 'ECONNABORTED') {
                await sock.sendMessage(chatId, {
                    text: '⏱️ Request timed out. Please try again later.'
                }, { quoted: message });
            }
            else {
                await sock.sendMessage(chatId, {
                    text: `❌ Failed to download TikTok video.\nReason: ${error.message}`
                }, { quoted: message });
            }
        }
}

module.exports = tiktokCommand; 
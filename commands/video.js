const axios = require('axios');
const yts = require('yt-search');

async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!text) {
            await sock.sendMessage(chatId, { text: 'Please provide text' }, { quoted: message });
            return;
        }

        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: "🔍", key: message.key }
        });

        let processingMsg = await sock.sendMessage(chatId, {
            text: `🎬 *Searching YouTube...*\n\n🔍 Query: "${text}"\n⏳ Please wait while I find your video...`
        }, { quoted: message });

        let videoUrl = '';
        let videoData = null;

        // Check if input is URL or search query
        if (text.startsWith('http://') || text.startsWith('https://')) {
            videoUrl = text;
        } else {
            const { videos } = await yts(text);

            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, {
                    react: { text: "😔", key: message.key }
                });

                await sock.sendMessage(chatId, {
                    text: "❌ *No Results Found*\n\nI couldn't find any videos matching your search.\n💡 Try different keywords or check the spelling!"
                }, { quoted: message });

                return;
            }

            videoUrl = videos[0].url;
            videoData = videos[0];
        }

        // Validate URL
        const ytRegex = /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|v\/|embed\/|shorts\/|playlist\?list=)?)([a-zA-Z0-9_-]{11})/gi;

        if (!ytRegex.test(videoUrl)) {
            await sock.sendMessage(chatId, {
                react: { text: "🚫", key: message.key }
            });

            await sock.sendMessage(chatId, {
                text: 'Invalid YouTube link'
            }, { quoted: message });

            return;
        }

        // Update to downloading
        await sock.sendMessage(chatId, {
            react: { text: "⬇️", key: message.key }
        });

        await sock.sendMessage(chatId, {
            text: `✅ *Video Found!*\n\n⬇️ Starting download process...\n🎥 Preparing 360p quality`,
            edit: processingMsg.key
        });

        // Fetch video data
        const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(videoUrl)}`;

        const response = await axios.get(apiUrl, {
            headers: {
                Accept: 'application/json'
            },
            timeout: 30000
        });

        if (response.status !== 200 || !response.data.status) {
            await sock.sendMessage(chatId, {
                react: { text: "😢", key: message.key }
            });

            await sock.sendMessage(chatId, {
                text: 'Download failed.'
            }, { quoted: message });

            return;
        }

        const data = response.data;
        const title = data.title || (videoData?.title || 'YouTube Video');
        const thumbnail = data.thumbnail || (videoData?.thumbnail || '');
        const videoDownloadUrl = data.videos["360"];
        const filename = `🎬 ${title.substring(0, 50)}.mp4`.replace(/[<>:"/\\|?*]/g, '');

        // Send preview
        await sock.sendMessage(chatId, {
            image: { url: thumbnail },
            caption: `🎬 *Video Details*\n\n📀 Title: ${title}\n🎥 Quality: 360p HD\n📊 Status: Downloading...\n\n🧑‍💻 *ANDY MD VIDEO SERVICE*`
        }, { quoted: message });

        // Send video
        await sock.sendMessage(chatId, {
            video: { url: videoDownloadUrl },
            mimetype: 'video/mp4',
            fileName: filename,
            caption: `🎬 *Download Complete!*\n\n📀 ${title}\n🎥 Quality: 360p HD\n✅ Successfully downloaded\n\n🧑‍💻 Powered By ANDY MD`,
            contextInfo: {
                externalAdReply: {
                    title: "🎬 ANDY MD VIDEO",
                    body: "Click for more downloads!",
                    mediaType: 2,
                    thumbnailUrl: thumbnail,
                    sourceUrl: "https://whatsapp.com/channel/0029VbBhe8lCRs1fCxZ9OM3U"
                }
            }
        }, { quoted: message });

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: "✅", key: message.key }
        });

    } catch (error) {
        console.error('Error in video command:', error);

        await sock.sendMessage(chatId, {
            react: { text: "💥", key: message.key }
        });

        await sock.sendMessage(chatId, {
            text: `❌ Error: ${error.message}`
        }, { quoted: message });
    }
}

module.exports = videoCommand;
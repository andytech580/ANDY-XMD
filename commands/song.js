const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');

async function songCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
            if (!text) {
                await sock.sendMessage(chatId, { text: 'please provide song name' }, { quoted: message });
            }

            // Add initial reaction
            await sock.sendMessage(chatId, { 
                react: { text: "🔍", key: message.key } 
            });

            // Search YouTube
            const { videos } = await yts(text);
            if (!videos || videos.length === 0) {
                await sock.sendMessage(chatId, { 
                    react: { text: "❌", key: message.key } 
                });
                await sock.sendMessage(chatId, { text:"No song found" }, { quoted: message });
                }

            const video = videos[0];
            
            // Update reaction to downloading
            await sock.sendMessage(chatId, { 
                react: { text: "⬇️", key: message.key } 
            });

            // Send video info
            await sock.sendMessage(chatId, {
                image: { url: video.thumbnail },
                caption: `🎵 *${video.title}*\n\n⬇️𝐀𝐧𝐝𝐲-𝐱𝐦𝐝 𝐦𝐮𝐬𝐢𝐜 𝐩𝐥𝐚𝐲𝐞𝐫 𝐝𝐨𝐰𝐧𝐥𝐨𝐚𝐝𝐢𝐧𝐠...`
            }, { quoted: message });

            // Download audio
            const apiUrl = `https://yt-dl.officialhectormanuel.workers.dev/?url=${encodeURIComponent(video.url)}`;
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.status || !data.audio) {
                await sock.sendMessage(chatId, { 
                    react: { text: "❌", key: message.key } 
                });
                await sock.sendMessage(chatId, { text: 'Download failed' }, { quoted: message });
                }

            // Success reaction
            await sock.sendMessage(chatId, { 
                react: { text: "✅", key: message.key } 
            });

            // Send audio
            await sock.sendMessage(chatId, {
                audio: { url: data.audio },
                mimetype: "audio/mpeg",
                fileName: `${data.title || video.title}.mp3`
            }, { quoted: message });
           } catch (err) {
        console.error('Song command error:', err);
        await sock.sendMessage(chatId, { text: '❌ Failed to download song.' }, { quoted: message });
    }
}

module.exports = songCommand;
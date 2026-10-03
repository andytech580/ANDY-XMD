const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const acrcloud = require('acrcloud');

const acr = new acrcloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: 'c33c767d683f78bd17d4bd4991955d81',
    access_secret: 'bvgaIAEtADBTbLwiPGYlxupWqkNGIjT7J9Ag2vIu',
});

async function shazamCommand(sock, chatId, message, qMessage) {
    try {
        // Get the audio/video to identify
        let mediaBuffer;

        if (qMessage) {
            // If replying to a message
            if (!qMessage.audioMessage && !qMessage.videoMessage) {
                await sock.sendMessage(chatId, {
                    text: '❌ Please reply to an audio or video message'
                }, { quoted: message });
                return;
            }

            const quoted = {
                message: qMessage.audioMessage
                    ? { audioMessage: qMessage.audioMessage }
                    : { videoMessage: qMessage.videoMessage }
            };

            mediaBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                { },
                { }
            );
        } else if (message.message?.audioMessage || message.message?.videoMessage) {
            // If media is in current message
            mediaBuffer = await downloadMediaMessage(
                message,
                'buffer',
                { },
                { }
            );
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Please reply to an audio or video, or send one with caption .shazam'
            }, { quoted: message });
            return;
        }

        // Identify the song
        const res = await acr.identify(mediaBuffer);

        const { code, msg } = res.status;
        if (code !== 0) throw new Error(msg);

        const music = res.metadata?.music?.[0];
        if (!music) throw new Error('No match found');

        const text = `
𝚁𝙴𝚂𝚄𝙻𝚃
• 📌 *TITLE*: ${music.title || 'NOT FOUND'}
• 👨‍🎤 *ARTIST*: ${music.artists?.map(a => a.name).join(', ') || 'NOT FOUND'}
• 💾 *ALBUM*: ${music.album?.name || 'NOT FOUND'}
• 🌐 *GENRE*: ${music.genres?.map(g => g.name).join(', ') || 'NOT FOUND'}
• 📆 *RELEASE DATE*: ${music.release_date || 'NOT FOUND'}
`.trim();

        // Send the result
        await sock.sendMessage(chatId, {
            text,
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363421568891511@newsletter',
                    newsletterName: '𝐀𝐧𝐝𝐲-𝐱𝐦𝐝',
                    serverMessageId: -1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in shazam command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to identify song. ${error.message || 'Please try again later.'}`
        }, { quoted: message });
    }
}

module.exports = shazamCommand;

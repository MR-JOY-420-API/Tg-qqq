const axios = require("axios");

module.exports = {
  config: {
    author: "JOY AHMED",
    name: "bd",
    aliases: ["bdvideo"],
    usePrefix: true,
    role: 0,
    cooldown: 5,
    description: "Search videos via BD API and open inside Telegram as Mini App",
    category: "media",
    usages: "/bd <search query> or just /bd"
  },

  onStart: async function ({ bot, chatId, msg, args }) {
    const messageId = msg ? msg.message_id : undefined;

    const query = args.length ? args.join(" ") : "latest";
    let loading = null;

    try {
      loading = await bot.sendMessage(chatId, `🔍 "${query}" দিয়ে ভিডিও খোঁজা হচ্ছে...`, {
        reply_to_message_id: messageId
      });

      // Vercel API Call
      const apiUrl = `https://bd-sx-vdeo-joy-api.vercel.app/api/search?q=${encodeURIComponent(query)}`;
      const response = await axios.get(apiUrl);
      const resData = response.data;

      if (loading) await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

      const videos = resData.data || resData.results || resData;
      if (!Array.isArray(videos) || videos.length === 0) {
        return bot.sendMessage(chatId, "❌ দুঃখিত, কোনো ভিডিও পাওয়া যায়নি!", {
          reply_to_message_id: messageId
        });
      }

      const topVideos = videos.slice(0, 5);
      
      let messageText = `🔎 কিওয়ার্ড: _${query}_\n\n`;
      
      topVideos.forEach((item, index) => {
        const title = item.title || `Video ${index + 1}`;
        messageText += `**${index + 1}.** ${title}\n`;
      });

      messageText += `\n👇 **নিচের বাটনগুলোতে (1, 2, 3, 4, 5) ক্লিক করুন:**`;

      const inlineKeyboard = [];
      let row = [];

      topVideos.forEach((item, index) => {
        const videoUrl = item.link || item.url || item.videoUrl;
        const buttonNumber = index + 1;

        if (videoUrl) {
          row.push({
            text: `${buttonNumber}`,
            web_app: { url: videoUrl }
          });
        }

        if (row.length === 5 || index === topVideos.length - 1) {
          inlineKeyboard.push(row);
          row = [];
        }
      });

      await bot.sendMessage(chatId, messageText, {
        reply_to_message_id: messageId,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: inlineKeyboard
        }
      });

    } catch (err) {
      console.error("BD Command Error:", err.message);
      if (loading) await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

      return bot.sendMessage(chatId, "❌ ভিডিও ফেচ করার সময় সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।", {
        reply_to_message_id: messageId
      });
    }
  }
};

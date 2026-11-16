const axios = require("axios");

module.exports = {
  config: {
    author: "JOY AHMED",
    name: "bd",
    aliases: ["bdvideo"],
    usePrefix: true,
    role: 0,
    cooldown: 5,
    description: "Search videos via BD API with 1, 2, 3, 4, 5 buttons",
    category: "media",
    usages: "/bd <search query> or just /bd (shows latest)"
  },

  onStart: async function ({ bot, chatId, msg, args }) {
    const messageId = msg ? msg.message_id : undefined;

    // যদি শুধু /bd লেখে, তবে ডিফল্ট কোনো কিওয়ার্ড বা লেটেস্ট সার্চ করবে
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

      // Clean up loading message
      if (loading) await bot.deleteMessage(chatId, loading.message_id).catch(() => {});

      // Check results
      const videos = resData.data || resData.results || resData;
      if (!Array.isArray(videos) || videos.length === 0) {
        return bot.sendMessage(chatId, "❌ দুঃখিত, কোনো ভিডিও পাওয়া যায়নি!", {
          reply_to_message_id: messageId
        });
      }

      // Take top 5 videos as requested
      const topVideos = videos.slice(0, 5);
      
      let messageText = `🎬  কিওয়ার্ড: _${query}_\n\n`;
      
      topVideos.forEach((item, index) => {
        const title = item.title || `Video ${index + 1}`;
        messageText += `**${index + 1}.** ${title}\n`;
      });

      messageText += `\n👇 **নিচের বাটনগুলোতে (1, 2, 3, 4, 5) ক্লিক করে ভিডিও দেখুন:**`;

      // 1, 2, 3, 4, 5 inline buttons layout
      const inlineKeyboard = [];
      let row = [];

      topVideos.forEach((item, index) => {
        const videoUrl = item.link || item.url || item.videoUrl;
        const buttonNumber = index + 1;

        if (videoUrl) {
          row.push({
            text: `${buttonNumber}`,
            url: videoUrl // Opens securely in mini app / web view without ads
          });
        }

        // প্রতি সারিতে ৫টি বা একসাথে সাজাতে পারেন (এখানে ৫টি বাটন এক লাইনে বা সাজানো হলো)
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

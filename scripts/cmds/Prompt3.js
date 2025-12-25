const axios = require('axios');

module.exports = {
    config: {
        name: "prompt3",
        aliases: ['p'],
        version: "1.0",
        author: "Nicolas tesla",
        countDown: 5,
        role: 0,
        shortDescription: "Generate an AI prompt ",
        longDescription: "Generates a Midjourney prompt based on text or image input.",
        category: "𝗔𝗜",
        guide: {
            en: "   {pn} <text>: Generate a prompt based on the text."
                + "\n   {pn} (reply to an image): Generate a prompt based on the replied image."
        }
    },

    onStart: async function({ message, event, args }) {
        try {
            let imageUrl; 

            if (event.type === "message_reply" && event.messageReply.attachments[0]?.type === 'photo') {
                imageUrl = event.messageReply.attachments[0].url; 
            } else {
                
                const promptText = args.join(" "); 
                if (!promptText) {
                    return message.reply("Please provide a prompt or reply to an image.");
                }
  
                const response = await axios.get(`https://nova-apis.onrender.com/prompt?prompt=${encodeURIComponent(promptText)}`);
                if (response.status === 200) {
                  return message.reply(response.data.prompt);
                }
            }
  
            if (imageUrl) {
              
              const response = await axios.get(`https://nova-apis.onrender.com/prompt?image=${encodeURIComponent(imageUrl)}`);
                if (response.status === 200) {
                    return message.reply(response.data.prompt); 
                }
            } else {
                
                return message.reply("Invalid input. Please provide a prompt or reply to an image.");
            }
        } catch (error) {
            console.error("Error generating prompt:", error);
            message.reply("An error occurred. Please try again later."); 
        }
    } 
};

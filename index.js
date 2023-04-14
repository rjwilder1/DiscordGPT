require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { Configuration, OpenAIApi } = require('openai');

const maxChars = 1500

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

client.on('ready', () => {
  console.log("Hey, I'm here!");
});

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
  });

const openai = new OpenAIApi(configuration);

client.on('messageCreate', async (message) => {

  if (message.author.bot) return;
  if (message.channel.id !== process.env.CHANNEL_ID) return;
  if (message.content.startsWith('#')) return;

  if (message.content.startsWith('!')) {

    try {
        await message.channel.sendTyping();

        const result = await openai
            .createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages: [{role: "user", content: process.env.BYPASS.toString() + message.content.toString()}],
                // max_tokens: 256, // limit token usage
            })
            .catch((error) => {
                console.log(`OPENAI ERR: ${error}`);
            });
        
        let messageText = result.data.choices[0].message.content.toString();
        let startIndex = 0;
        let endIndex = maxChars;
        let howmanysplit = 0

        while (startIndex < messageText.length) {
            if (endIndex > messageText.length) {
            endIndex = messageText.length;
            }
            const messageChunk = messageText.substring(startIndex, endIndex);
            message.reply(messageChunk);
            startIndex = endIndex;
            endIndex += maxChars;
            howmanysplit += 1;
        } 

    } catch (error) { console.error(`ERR: ${error}`); }
    } else {
        let conversationLog = [{ role: 'system', content: 'You are a friendly chatbot.' }];

        try {
            await message.channel.sendTyping();
        
            let prevMessages = await message.channel.messages.fetch({ limit: 15 });
            prevMessages.reverse();
        
            prevMessages.forEach((msg) => {
                if (message.content.startsWith('!')) return;
                if (message.content.startsWith('#')) return;
                if (msg.author.id !== client.user.id && message.author.bot) return;
                if (msg.author.id !== message.author.id) return;
        
                conversationLog.push({
                role: 'user',
                content: msg.content,
                });
        });
    
        const result = await openai
            .createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
            // max_tokens: 256, // limit token usage
            })
            .catch((error) => {
            console.log(`OPENAI ERR: ${error}`);
            });
        
        let messageText = result.data.choices[0].message.content.toString();
        let startIndex = 0;
        let endIndex = maxChars;
        let howmanysplit = 0
    
        while (startIndex < messageText.length) {
            if (endIndex > messageText.length) {
                endIndex = messageText.length;
            }
            const messageChunk = messageText.substring(startIndex, endIndex);
            message.reply(messageChunk);
            startIndex = endIndex;
            endIndex += maxChars;
            howmanysplit += 1;
        } 
    
        } catch (error) { console.error(`ERR: ${error}`); }
    }
});

client.login(process.env.TOKEN);

/*  
    message.reply(result.data.choices[0].message);
    console.log(result.data.choices[0].message);
    message.reply("Response Length is " + resplength);
    message.reply("Split " + howmanysplit.toString() + " times")
    console.log(result.data.choices[0].message.content); */
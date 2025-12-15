const bedrock = require('bedrock-protocol');
const https = require('https');
const { arabicToMinecraft } = require('./arabic-fix');
const { readFileSync } = require('fs')
require('dotenv').config();

//__-__-__-__-__-__-__-__-__-__-__-__-
// plaese change host and port to your server 
const ServerHost = "your-server.net";
    
const ServerPort = 19132; 
    

//you can git free api key from https://aistudio.google.com/apikey
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
//__-__-__-__-__-__-__-__-__-__-__-__-



function loadJsonFromFileSync(path) {
    try {
        // Read the JSON file for skin_data
        const jsonData = readFileSync(path, 'utf8');

        // Parse the JSON data
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

const skin_data = loadJsonFromFileSync('ai_skin_data.json')

const conversations = {};
const MAX_HISTORY_LENGTH = 6; // Maximum number of messages to keep in history

function processOnlyArabicParts(text) {

  // Check if the text is null, undefined, or empty, and return if it is.
  if (!text) {return text;}
  console.log(text)
  if (/^[\u0000-\u007F0-9\s\p{P}]+$/u.test(text)) {return text;}
  return arabicToMinecraft(text, {digits: 'keep'});
}

const client = bedrock.createClient({
    host: ServerHost,
    port: ServerPort,
    username: BOT_USERNAME,
    offline: true,
    skinData: '§bAI§f',
})



async function getAIResponse(history) {
    return new Promise((resolve) => {
        const geminiContents = history.map(turn => ({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.content }]
        }));
        const systemPrompt = {
            parts: [{
                text: "You are a friendly assistant in Minecraft chat. Don't send emojis. give short and clear answer."
            }]
        };
        const postData = JSON.stringify({
            contents: geminiContents,
            systemInstruction: systemPrompt
        });
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, // you can change model here. see more https://developers.generativeai.google/products/models
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => { body += chunk; });
            res.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    if (data.candidates && data.candidates[0].content.parts[0]) {
                        resolve(data.candidates[0].content.parts[0].text.substring(0, 10000));
                    } else {
                        console.error('Unexpected API response:', body);
                        resolve("§cthere was an error in api response. please add api key.");
                    }
                } catch (error) {
                    console.error('Error parsing JSON response:', error.message);
                    resolve("§c sorry, there was an error.");
                }
            });
        });
        req.on('error', (error) => {
            console.error('Error with API request:', error.message);
            resolve("§c sorry, i can't reach the api.");
        });
        req.write(postData);
        req.end();
    });
}

client.on('spawn', () => {
  console.log('Bot connected!');
  setTimeout(() => {
    const welcomeMessage = 'How i can §bhelp you§f?';
    client.queue('text', { //welcome message
      type: 'chat',
      needs_translation: false,
      source_name: '§bAI§f',
      xuid: '',
      platform_chat_id: '',
      message: welcomeMessage,
      parameters: [],
      filtered_message: ''
    });
  }, 2000);
});

client.on('text', async (packet) => {
  if (packet.type !== 'chat' || packet.source_name === BOT_USERNAME) return;

  const player = packet.source_name;
  const originalMessage = packet.message;

  if (originalMessage.startsWith('!')) {
      return;
  }
  
  

  if (!originalMessage) {
      return;
  }

  if (!conversations[player]) {
    conversations[player] = [];
  }

  const playerHistory = conversations[player];
  console.log(`[${player}] Ask: ${originalMessage}`);
  playerHistory.push({ role: 'user', content: originalMessage });

  while (playerHistory.length > MAX_HISTORY_LENGTH) {
    playerHistory.shift();
  }

  let reply = await getAIResponse(playerHistory);
 reply = reply.replace(/\*/g, '');
  playerHistory.push({ role: 'assistant', content: reply });

   while (playerHistory.length > MAX_HISTORY_LENGTH) {
    playerHistory.shift();
  }

  setTimeout(() => {
    const finalMessage = `${reply}`;
    const processedMessage = processOnlyArabicParts(finalMessage);

    client.write('text', {
      type: 'chat',
      needs_translation: false,
      source_name: '§bAI§f',
      xuid: '',
      platform_chat_id: '',
      message: processedMessage,
      parameters: [],
      filtered_message: ''
    });

   // console.log(`[Bot to ${player}] message: ${processedMessage}`);
  }, 1500);
});

client.on('error', (err) => {
  console.error('Error:', err.message);
});

console.log('Starting AI...');

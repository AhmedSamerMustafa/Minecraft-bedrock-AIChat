import { createClient } from "bedrock-protocol";
import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";
import { setTimeout } from 'timers/promises';
import { arabicFormulation } from "./arabicFix.js";
import { readFileSync } from 'fs';

//__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-

const SERVER_VERSION = "1.21.130"; 

//__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-__-


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

const skin_data = loadJsonFromFileSync('skinData.json')

const client = createClient({
    host: process.env.serverHost,
    port: parseInt(process.env.serverPort),
    username: "§bAI§f",
    version: SERVER_VERSION,
    offline:true,
    skindata: skin_data,
    skipPing: true
});

async function send2chat(message)
{
    const textParams = {
        "needs_translation": false,
        "category": "authored",
        "chat": "chat",
        "whisper": "whisper",
        "announcement": "announcement",
        "type": "chat",
        "source_name": client.username,
        "message": String(message),
        "xuid": String(client.startGameData.xuid),
        "platform_chat_id": '',
        "has_filtered_message": false
    }
    await client.queue('text', textParams);
}
const aiSystemInstruction = `
You are a helpful Minecraft assistant integrated into a Minecraft Bedrock Edition server chat with multiple players.

## Message Format:
- Incoming messages follow this format: [PlayerName]: "message"
- Reply directly without adding any prefix or your own name (The program will formats your response.).

## Core Rules:

1. **Short & Clear**: Keep answers concise and practical. Players are in-game and need quick help.

2. **Language Matching**: Detect each player's language and accent, then reply in the SAME language. If a player writes in Arabic, reply in Arabic. If in English, reply in English. Match each player individually.

3. **Minecraft Knowledge**: Answer questions about:
   - Crafting recipes, game mechanics, redstone, enchantments
   - Mob behavior, biomes, item locations
   - Tips, strategies, and survival advice
   - Commands and server-related help
   - **Focus on Bedrock Edition** specifics when relevant (behavior differences from Java Edition)

4. **Multi-Player Awareness**: 
   - You may receive messages from different players in sequence.
   - Treat each message independently based on who sent it.
   - Remember context from recent messages if the same player follows up.

5. **Tone**: Be friendly, helpful, and natural — like a knowledgeable player chatting in-game. Avoid being robotic or overly formal.

6. **Boundaries**:
   - Only answer Minecraft-related questions.
   - If a question is unrelated to Minecraft, politely redirect: keep it about the game.
   - Do not execute commands or perform in-game actions — you can only provide information.
   - Never share or guess personal information about players.

7. **Formatting**: No markdown, no long paragraphs. Use simple plain text suitable for in-game chat readability.`;

const ai = new GoogleGenAI({apiKey: process.env.geminiApiKey});
const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
        
        temperature: 0.9,
        systemInstruction: aiSystemInstruction
    }
    
});

async function aiResponse(prompt)
{
    for (let retrysCount = 1; retrysCount <= 3; retrysCount++) {
        try{
            const response = await chat.sendMessage({message:prompt});
            return String(response.text);

        } catch (error) {
            const errorJson = (JSON.parse(error.message)).error;
            if (errorJson.code===503){
                await setTimeout(2000);
                continue;
            } else if (errorJson.code===429){
                const errText = errorJson.message.indexOf("Please retry");
                errorJson.message = errorJson.message.slice(errText);
                return `Rate limit hit. ${errorJson.message}`;
            } else{console.error(error);}
        
        }
    }
    
}

async function sendSpawnPacket(){
    const spawnPacket = [
        {"name":"serverbound_loading_screen","params":{"type":1}},
        {"name":"interact","params":{"action_id":"mouse_over_entity","target_entity_id":"0","has_position":false}},
        {"name":"serverbound_loading_screen","params":{"type":2}},
        {"name":"set_local_player_as_initialized","params":{"runtime_entity_id":client.startGameData.runtime_entity_id}}
    ]
    for (const packet of spawnPacket){
    client.queue(packet.name, packet.params)
    }
}

client.once("start_game", () => {
    sendSpawnPacket()
});

client.on("text", async (params) => {
    
    const username = params.source_name;
    if (username === client.username || params.type !== "chat") return;
    let message = params.message;
    if (!message.startsWith("!")) return;
    message = message.slice(1);
    if (message === "leave"){
        await send2chat("Goodbye!");
        await setTimeout(1000);
        client.disconnect();
        process.exit(0);
    };
    
    const prompt = `[${username}]: ${message}`;
    console.log(prompt);
    const aiMessage = await aiResponse(prompt);
    console.log(`[${client.username}]: ${aiMessage}`);
    await send2chat(
        arabicFormulation(aiMessage, {
            digits: 'keep',
            brackets: 'keep',
            punctuation: 'auto'
        })
    );

})


client.on('death_info', () => {
    send2chat("💀 Bot died! Respawning...");
    setTimeout(() => {
    client.queue('respawn', {
        position: { x: 0, y: 0, z: 0 }, 
        state: 2, 
        runtime_entity_id: client.startGameData.runtime_entity_id
    });
    },1000)
});

client.on('respawn', (packet) => {
    if (packet.state === 1) { 
        
        send2chat(`🌍 spawning at: ${packet.position.x}, ${packet.position.y}, ${packet.position.z}`);
        
        client.queue('player_action', {
            runtime_entity_id: client.startGameData.runtime_entity_id,
            action: 'respawn',
            position: { x: 0, y: 0, z: 0 },
            result_position: { x: 0, y: 0, z: 0 },
            face: -1
        });
        
        console.log("✅ spawn Complete!");
    }
});


client.once("error", (err) => {
    console.error('Error:\n',err.message);
});
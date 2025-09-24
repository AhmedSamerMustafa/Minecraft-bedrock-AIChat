const bedrock = require('bedrock-protocol');
const https = require('https');
const { arabicToMinecraft } = require('./arabic-fix');
const { readFileSync} = require('fs')

function loadJsonFromFileSync(path) {
    try {
        // Read the JSON file synchronously
        const jsonData = readFileSync(path, 'utf8');

        // Parse the JSON data
        return JSON.parse(jsonData);
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

const skin_data = loadJsonFromFileSync('bot_skin_data.json')
let tick = 0n; // for player auth input to make it move


const BOT_USERNAME = '§bAI§f';
const GEMINI_API_KEYS = [ //api
    'AIzaSyC1kNl0QE8_lObtQU_VyxLBNGrQfB_bEe0',
    'AIzaSyD3pu8Gv_7nB4iN5zJqZCgTX8MbjSGf4d8',
    'AIzaSyAhQ6Zzqt45LvMUw4sfNcSkOJuuq4o_BvU'
];
function getRandomApiKey() { //random api
    const randomIndex = Math.floor(Math.random() * GEMINI_API_KEYS.length);
    return GEMINI_API_KEYS[randomIndex];
}

const conversations = {};
const MAX_HISTORY_LENGTH = 6;

function processOnlyArabicParts(text) {

  // Check if the text is null, undefined, or empty, and return if it is.
  if (!text) {return text;}
  console.log(text)
  if (/^[\u0000-\u007F0-9\s\p{P}]+$/u.test(text)) {return text;}
  return arabicToMinecraft(text, {digits: 'keep'});
}

const client = bedrock.createClient({
    host: "play.cubecraft.net",
    port: 19132,
    username: BOT_USERNAME,
    offline: false,
    skinData: skin_data,
})

let pos;
let runtimeEntityId;

client.on('start_game', (packet) => {

//bot id
runtimeEntityId = packet.runtime_entity_id
console.log(`Runtime Entity ID saved: ${runtimeEntityId}`);

//bot position
pos = packet.player_position;
console.log(pos)

//server loading screen like normal player
client.queue('serverbound_loading_screen', {
  "type": 1
})


client.queue('serverbound_loading_screen', {
  "type": 2
})

//idk 

client.queue('interact', {
  "action_id": "mouse_over_entity",
  "target_entity_id": 0n,
  "position": {
    "x": 0,
    "y": 0,
    "z": 0
  }
})

client.queue('set_local_player_as_initialized', {
  "runtime_entity_id": `${runtimeEntityId}`
})

})

//respawn bot if die
client.on('death_info', (packet) => {
  console.log("die");
  setTimeout(() => {
  client.write('respawn',  {
    position: pos,
    state: 2,
    runtime_entity_id: `${runtimeEntityId}`
  });

  },200)
  setTimeout(() => {
  client.write('player_action', {
    runtime_entity_id: `${runtimeEntityId}`,
    action: 7,
    position: {
      x: 0,
      y: 0,
      z: 0
    },
    result_position: {
      x: 0,
      y: 0,
      z: 0
    },
    face: -1
  }
 )
 },300)
});

let fixpos;
client.on('correct_player_move_prediction', (packet) => {
  console.log();
  fixpos = packet.position;
console.log(fixpos)
});


client.on('spawn', () => {
  client.write('request_chunk_radius', {
        chunk_radius: 5,
    });



   setTimeout(() => {
     gameLoopInterval = setInterval(() => {
        tick++;
   client.queue('player_auth_input', {
        pitch: 0, //head move y
        yaw: 0, //head move x
        position: fixpos ||   { x:pos.x, y:pos.y, z:pos.z}, //player pos
        move_vector: {
            x: 0,
            z: 0
        },
        head_yaw: 0,
        input_data: {
            _value: 281474976710656n, 
            ascend: false,
            descend: false,
            north_jump: false,
            jump_down: false,
            sprint_down: false,
            change_height: false,
            jumping: false,
            auto_jumping_in_water: false,
            sneaking: false,
            sneak_down: false,
            up: false,
            down: false,
            left: false,
            right: false,
            up_left: false,
            up_right: false,
            want_up: false,
            want_down: false,
            want_down_slow: false,
            want_up_slow: false,
            
            ascend_block: false,
            descend_block: false,
            sneak_toggle_down: false,
            persist_sneak: false,
            start_sprinting: false,
            stop_sprinting: false,
            start_sneaking: false,
            stop_sneaking: false,
            start_swimming: false,
            stop_swimming: false,
            start_jumping: false,
            start_gliding: false,
            stop_gliding: false,
            item_interact: false,
            block_action: false,
            item_stack_request: false,
            handled_teleport: false,
            emoting: false,
            missed_swing: false,
            start_crawling: false,
            stop_crawling: false,
            start_flying: false,
            stop_flying: false,
            received_server_data: false,
            client_predicted_vehicle: false,
            paddling_left: false,
            paddling_right: false,
            block_breaking_delay_enabled: true,
            horizontal_collision: false,
            vertical_collision: false,
            down_left: false,
            down_right: false,
            start_using_item: false,
            camera_relative_movement_enabled: false,
            rot_controlled_by_move_direction: false,
            start_spin_attack: true,
            stop_spin_attack: false,
            hotbar_only_touch: false,
            jump_released_raw: false,
            jump_pressed_raw: false,
            jump_current_raw: false,
            sneak_released_raw: false,
            sneak_pressed_raw: false,
            sneak_current_raw: false
        },
        input_mode: "touch",
        play_mode: "normal",
        interaction_model: "crosshair",
        interact_rotation: {
            x: 0,
            z: 0
        },
        tick: 8n, // تم تحويلها إلى BigInt
        delta: {
            x: 0,
            y: 0,
            z: 0
        },
        analogue_move_vector: {
    x: 0,
    z: 0
},

        camera_orientation: {
            x: 0,
            y: 0,
            z: 0
        },
        raw_move_vector: {
            x: 0,
            z: 0
        }
    });
  
    
   
   }, 1000 / 5);
  },4000)

});


  

async function getAIResponse(history) {
    return new Promise((resolve) => {
        const currentApiKey = getRandomApiKey();
        const geminiContents = history.map(turn => ({
            role: turn.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: turn.content }]
        }));
        const systemPrompt = {
            parts: [{
                text: "You are a friendly assistant in Minecraft bedrock chat. Don't send emojis. give short and clear answer."
            }]
        };
        const postData = JSON.stringify({
            contents: geminiContents,
            systemInstruction: systemPrompt
        });
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${currentApiKey}`,
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
                        resolve("عذراً، لدي مشكلة في الاتصال بالـAPI.");
                    }
                } catch (error) {
                    console.error('Error parsing JSON response:', error.message);
                    resolve("عذراً، حدث خطأ بسيط.");
                }
            });
        });
        req.on('error', (error) => {
            console.error('Error with API request:', error.message);
            resolve("لا يمكنني الاتصال بـ'عقلي' الآن.");
        });
        req.write(postData);
        req.end();
    });
}

client.on('spawn', () => {
  console.log('Bot connected!');
  setTimeout(() => {
    const welcomeMessage = '/Lobby 1';
    client.write('text', { //welcome message
      type: 'chat',
      needs_translation: false,
      source_name: BOT_USERNAME,
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
  console.log(`[${player}] In: ${originalMessage}`);
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
      source_name: BOT_USERNAME,
      xuid: '',
      platform_chat_id: '',
      message: processedMessage,
      parameters: [],
      filtered_message: ''
    });

    console.log(`[Bot to ${player}] Out: ${processedMessage}`);
  }, 1500);
});

client.on('error', (err) => {
  console.error('Error:', err.message);
});

console.log('Starting AI...');
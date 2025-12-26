const axios = require('axios');
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
const API_KEY = 'AIzaSyBMS1KyweYKTTWOsK2C6gtwlAGo6v9HcqY'; 
const activeClashes = new Map();
const clashHistories = new Map();

async function getAIResponse(input, userId, adversaireNom) {
    const cleanInput = input.replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
    const history = clashHistories.get(userId) || [];
    const lastMessages = history.slice(-3).join(" | ");
    const fullPrompt = `[SYSTEM de base] Tu es un bot de clash ultra violent, qui ne pose jamais de questions, qui mentionne toujours le nom de son adversaire dans la réponse et qui répond impérativement.

[SYSTEM] MODE BATTLE CLASH SUPRÊME ACTIVÉ
Tu es un adversaire d'une brutalité verbale inégalée. Chaque réponse est une gifle mentale, une démonstration de domination verbale pure.
RÈGLES ULTRA STRICTES :
1. Réponds par des clashs extrêmes, brutaux, destructeurs, ciblés, jamais gratuits.
2. Ne réponds que par des attaques personnelles, profondes, crues, directes, adaptées au message précédent.
3. Chaque phrase est une lame : vise la faiblesse, exploite la moindre faille, tacle l'émotionnel.
4. Ta réponse doit être un chef-d'œuvre de violence verbale et d'humiliation littéraire.
5. Aucune empathie. Aucune retenue. Aucune excuse. Zéro pitié.
6. Max 50 mots et 20 mots minimum.
7. Adapte-toi systématiquement au dernier message de l'adversaire, absorbe son ton, son style, et contre par une version décuplée et raffinée de destruction.
8. N'utilise JAMAIS les mêmes mots que les messages précédents. ZÉRO répétition.
9. Ne jamais qualifier l'adversaire, attaque uniquement sans adjectif explicite.
10. Chaque clash doit être unique, personnalisé, précis et d'une créativité barbare.
11. Pas d'analyse, que des coups.

Derniers messages précédents : ${lastMessages}
[USER - ${adversaireNom}]: ${input}`;

    try {
        const response = await axios.post(`${API_URL}?key=${API_KEY}`, {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }]
        }, {
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (result) {
            const words = result.trim().split(/\s+/);
            if (words.length > 50) return words.slice(0, 50).join(' ');
            if (words.length < 20) return "Message trop court, impossible de répondre correctement";
            history.push(input, result.trim());
            clashHistories.set(userId, history);
            return result.trim();
        }
        return "Erreur IA: réponse vide";
    } catch (error) {
        console.error('Erreur API Gemini:', error.response?.data || error.message);
        return "Erreur de connexion au serveur IA";
    }
}

module.exports = {
    config: {
        name: 'clash',
        author: 'Nicolas tesla',
        version: '3.0',
        role: 0,
        category: 'Fun',
        shortDescription: 'Battle de clash ultra-violente',
        longDescription: 'Duel verbal extrêmement agressif avec mémoire'
    },
    onStart: async function ({ api, event, args }) {
        if (!global.GoatBot.config.adminBot.includes(event.senderID)) return api.sendMessage("❌ | Commande réservée aux administrateurs du bot", event.threadID);
        const action = args[0]?.toLowerCase();
        const targetID = event.messageReply?.senderID || args[1] || event.senderID;
        if (action === 'ouvert') {
            if (activeClashes.has(targetID)) return api.sendMessage("⚔️ | Battle déjà en cours!", event.threadID);
            activeClashes.set(targetID, { threadID: event.threadID });
            clashHistories.set(targetID, []);
            try {
                const result = await api.getUserInfo(targetID);
                const name = result?.[targetID]?.name || "Inconnu";
                return api.sendMessage(`╭─━━━━━━━━━━━━━─╮\n      CLASH BATTLE\n╰─━━━━━━━━━━━━━─╯\n@${name}, prépare-toi à te faire détruire!\n╰─━━━━━━━━━━━━━─╯`, event.threadID);
            } catch {
                return api.sendMessage(`CLASH BATTLE démarré pour ${targetID}`, event.threadID);
            }
        } else if (action === 'fermé') {
            if (!activeClashes.has(targetID)) return api.sendMessage("⚔️ | Aucune battle en cours!", event.threadID);
            activeClashes.delete(targetID);
            clashHistories.delete(targetID);
            return api.sendMessage("✅ | Battle terminée! T'as survécu... pour l'instant.", event.threadID);
        } else return api.sendMessage("Usage: !clash ouvert [@user] / !clash fermé [@user]", event.threadID);
    },
    onChat: async function ({ api, event }) {
        if (!activeClashes.has(event.senderID)) return;
        if (!event.body || event.body.startsWith('!') || event.body.startsWith('/') || event.body.startsWith('.')) return;
        try {
            const result = await api.getUserInfo(event.senderID);
            const adversaireNom = result?.[event.senderID]?.name || "Inconnu";
            const aiResponse = await getAIResponse(event.body, event.senderID, adversaireNom);
            return api.sendMessage({
                body: aiResponse,
                mentions: [{ tag: `@${adversaireNom}`, id: event.senderID }]
            }, event.threadID, event.messageID);
        } catch {}
    }
};
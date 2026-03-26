require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;
const SEEN_FILE = './seen.json';

const pokemonList = [
  "Pikachu",
  "Charizard",
  "Gengar",
  "Eevee",
  "Snorlax",
  "Mewtwo",
  "Lucario",
  "Bulbasaur",
  "Squirtle",
  "Charmander",
  "Greninja",
  "Rayquaza"
];

function getRandomPokemon() {
  const index = Math.floor(Math.random() * pokemonList.length);
  return pokemonList[index];
}

async function sendTelegramMessage(text) {
  const url = 'https://api.telegram.org/bot${TOKEN}/sendMessage';

  await axios.post(url, {
    chat_id: CHAT_ID,
    text
  });
}

async function fetchPage(url) {
  const response = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0"
    },
    timeout: 10000
  });

  return response.data;
}

function findRelevantLines(html) {
  const etbMatches = html.match(/[^<>\n]*Elite Trainer Box[^<>\n]*/gi) || [];
  const preorderMatches = html.match(/[^<>\n]*preorder[^<>\n]*/gi) || [];

  return [...new Set([...etbMatches, ...preorderMatches])]
    .map(x =>
      x
        .replace(/&quot;/g, "")
        .replace(/&amp;/g, "&")
        .replace(/\\/g, "")
        .trim()
    )
    .filter(x => {
      const lower = x.toLowerCase();
      return (
        x.length > 10 &&
        x.length < 140 &&
        !lower.includes("javascript") &&
        !lower.includes("schema") &&
        !lower.includes("@context") &&
        !lower.includes("meta") &&
        !x.includes("{") &&
        !x.includes("}")
      );
    })
    .slice(0, 5);
}

function loadSeen() {
  try {
    return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveSeen(seen) {
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen, null, 2));
}

async function scanPokemonCenter() {
  const url = "https://www.pokemoncenter.com/search/etb-box";
  const html = await fetchPage(url);
  const results = findRelevantLines(html);

  const pokemon = getRandomPokemon();

  await sendTelegramMessage(`✅ Check complete — ${pokemon} is watching Pokémon Center`);

  if (results.length === 0) {
    console.log("Pokemon Center: No ETB/preorder results found.");
    return;
  }

  const seen = loadSeen();
  const newResults = results.filter(item => !seen.includes(item));

  if (newResults.length === 0) {
    console.log("Pokemon Center: No new ETB/preorder results.");
    return;
  }

  const message = [
    "🚨 NEW Pokemon Center ETB / Preorder Alert 🚨",
    "",
    ...newResults.map((item, i) => `${i + 1}. ${item.slice(0, 100)}`),
    "",
    "Link: https://www.pokemoncenter.com/search/etb-box"
  ].join("\n");

  await sendTelegramMessage(message);
  console.log("Pokemon Center alert sent!");

  saveSeen([...new Set([...seen, ...results])]);
}

async function main() {
  try {
    await scanPokemonCenter();
  } catch (error) {
    console.log("Pokemon Center Error:", error.response?.data || error.message);
  }
}

main();

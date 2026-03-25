require('dotenv').config();
const axios = require('axios');

const TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

async function sendTelegramMessage(text) {
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

  await axios.post(url, {
    chat_id: CHAT_ID,
    text: text
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

function findETBLines(html) {
  const matches = html.match(/[^<>\n]*Elite Trainer Box[^<>\n]*/gi) || [];
  return [...new Set(matches)];
}

async function scanPokemonCenter() {
  const url = "https://www.pokemoncenter.com/category/trading-card-game";
  const html = await fetchPage(url);
  const etbs = findETBLines(html).slice(0, 2);

  if (etbs.length === 0) {
    console.log("Pokemon Center: No ETBs found.");
    return;
  }

  const message = [
    "🚨 Pokemon Center ETB 🚨",
    "",
    ...etbs.map((name, i) => `${i + 1}. ${name.trim().slice(0, 50)}`)
  ].join("\n");

  await sendTelegramMessage(message);
  console.log("Pokemon Center alert sent!");
}

async function scanTarget() {
  const url = "https://www.target.com/s?searchTerm=pokemon+elite+trainer+box";
  const html = await fetchPage(url);
  const etbs = findETBLines(html).slice(0, 2);

  if (etbs.length === 0) {
    console.log("Target: No ETBs found.");
    return;
  }

  const message = [
    "🎯 Target ETB 🎯",
    "",
    ...etbs.map((name, i) => `${i + 1}. ${name.trim().slice(0, 50)}`)
  ].join("\n");

  await sendTelegramMessage(message);
  console.log("Target alert sent!");
}

async function main() {
  try {
    await scanPokemonCenter();
  } catch (error) {
    console.log("Pokemon Center Error:", error.message);
  }

  try {
    await scanTarget();
  } catch (error) {
    console.log("Target Error:", error.message);
  }
}

main();
setInterval(main, 5 * 60 * 1000);
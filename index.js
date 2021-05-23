/**
 * @fileoverview the file to run for madness
 */

require('dotenv').config();

const express = require('express');
const app = express();
const port = 3000;

app.get('/', function (req, res) {
  res.send('this is a cool bot');
});

app.listen(port, function() {
  console.log(`listening at port ${port}`);
});

var questions;
let curQuestionIndex = -1;

const {google} = require('googleapis');
const google_sheets = new google.auth.JWT(
  process.env.EMAIL, null, process.env.PRIVATE_KEY,
  //TODO: make the credentials work within environment variables
  // creds.client_email, null, creds.private_key,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

google_sheets.authorize( (err, tokens) =>{
  if (err) {
    console.log(err);
    return;
  }else{
    console.log("ack everything worked and nothing broke");
    gsrun(google_sheets);
  }
});

async function gsrun(cl){
  const gsapi = google.sheets({version: "v4", auth: cl});
  const spread_sheet_questions = {
    spreadsheetId: process.env.SHEET_ID,
    range: "Questions!A2:D2000"
  };
  let questions_sheet = await gsapi.spreadsheets.values.get(spread_sheet_questions);
  questions = questions_sheet.data.values;
}

const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
  if (msg.content.startsWith(prefix.concat("trivia"))) {
    curQuestionIndex = Math.floor(Math.random() * questions.length);
    msg.channel.send(questions[curQuestionIndex][0]);
  }
  if (msg.content.toLowerCase().includes(questions[curQuestionIndex][1])){
    msg.reply(" congrats!");
  }
});

client.login(process.env.TOKEN);
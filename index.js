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
  ['https://www.googleapis.com/auth/spreadsheets']
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
  const id = process.env.SHEET_ID;
  const spreadSheetQuestions = {
    spreadsheetId: id,
    range: "Questions!A2:D2000"
  };
  let questionSheet = await gsapi.spreadsheets.values.get(spreadSheetQuestions);
  questions = questionSheet.data.values;
}

async function updateUsers(cl, user){
  const gsapi = google.sheets({version: "v4", auth: cl});
  const id = process.env.SHEET_ID;
  const readUsers = {
    spreadsheetId: id,
    range: "Users!A2:E2000"
  };
  let userData = (await gsapi.spreadsheets.values.get(readUsers)).data.values;
  let foundUser = false;
  for (let i = 0;i < userData.length;i++){
    if (userData[i][0] === user) {
      userData[i][1] = parseInt(userData[i][1]) + 10;
      userData[i][2] = parseInt(userData[i][2]) + 10;
      userData[i][3] = parseInt(userData[i][3]) + 10;
      userData[i][4] = parseInt(userData[i][4]) + 10;
      foundUser = true;
    }
  }
  if (!foundUser) {
    userData.push([user, 10, 10, 10, 10]);
  }
  const spreadSheetUsers = {
    spreadsheetId: id,
    range: "Users!A2",
    valueInputOption: "USER_ENTERED",
    resource: {values: userData}
  };
  gsapi.spreadsheets.values.update(spreadSheetUsers);
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
    const embed = new Discord.MessageEmbed()
      .setColor("#5f0f22")
      .setTitle("QUESTION TIME")
      .setAuthor("follow " + process.env.ACCOUNT + " ;)", process.env.PFP_LINK, process.env.LINK)
      .setDescription(questions[curQuestionIndex][0])
      .addFields(
        {name:"Category: ", value:questions[curQuestionIndex][3], inline:false},
        {name:"Difficuty: ", value:questions[curQuestionIndex][2], inline:false}
      )
      
    msg.channel.send(embed);
  }
  if (msg.content.toLowerCase().includes(questions[curQuestionIndex][1].toLowerCase())){
    msg.reply("congrats!");
    await updateUsers(google_sheets, msg.author.id);
  }
});

client.login(process.env.TOKEN);
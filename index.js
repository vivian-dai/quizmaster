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

class TriviaGame {
  constructor (questions, questionCount, time) {
    this.questions = questions;
    this.questionCount = questionCount;
    this.time = time;
    this.curQuestionIndex = Math.floor(Math.random() * this.questions.length);
  }
  getQuestion() {
    return this.questions[this.curQuestionIndex][0];
  }
  getDifficulty() {
    return this.questions[this.curQuestionIndex][2];
  }
  getTopic() {
    return this.questions[this.curQuestionIndex][3];
  }
  checkAnswer(submission) {
    if(submission.toLowerCase().includes(this.questions[this.curQuestionIndex][1].toLowerCase())) {
      this.questionCount--;
      this.curQuestionIndex = Math.floor(Math.random() * this.questions.length);
      return true;
    } else {
      return false;
    }
  }
  isRoundOver() {
    if (this.questionCount <= 0) {
      return true;
    } else {
      return false;
    }
  }
}

var questions;
let curQuestionIndex = -1;
var games = new Object();

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

async function getRankAndScore(cl, user) {
  let rankAndScore = [1, 0, 0, 0, 0];
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
      rankAndScore[1] = parseInt(userData[i][1]);
      rankAndScore[2] = parseInt(userData[i][2]);
      rankAndScore[3] = parseInt(userData[i][3]);
      rankAndScore[4] = parseInt(userData[i][4]);
      foundUser = true;
    }
  }
  if (!foundUser) {
    return null;
  }
  for (let i = 0;i < userData.length;i++){
    if (userData[i][1] > rankAndScore[1]) {
      rankAndScore[0]++;
    }
  }
  return rankAndScore;
}

const Discord = require('discord.js');
const e = require('express');
const client = new Discord.Client();
const prefix = "!";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.content === prefix.concat("stop")) {
    games[msg.channel.id] = undefined;
    const embed = new Discord.MessageEmbed()
      .setColor("#5f0f22")
      .setDescription("game stoped")
    msg.channel.send(embed);
  }

  if (msg.content === prefix.concat("rank")) {
    const rankAndScore = await getRankAndScore(google_sheets, msg.author.id);
    const embed = new Discord.MessageEmbed()
      .setAuthor(msg.author.username, msg.author.displayAvatarURL())
      .setColor("#5f0f22")
      .setTitle("Rank: " + rankAndScore[0])
      .addFields(
        {name:"All time score:", value:rankAndScore[1], inline:false},
        {name:"Monthly score:", value:rankAndScore[2], inline:false},
        {name:"Weekly score:", value:rankAndScore[3], inline:false},
        {name:"Daily score:", value:rankAndScore[4], inline:false}
      )
    msg.channel.send(embed);
  }

  if (msg.content.startsWith(prefix.concat("trivia"))) {
    if(games[msg.channel.id] !== undefined) {
      const embed = new Discord.MessageEmbed()
        .setColor("#ff0000")
        .setTitle("WHOA WHOA WHOA BUDDY")
        .setDescription("you already have a game in session")
      msg.channel.send(embed);
    }else{
      let params = msg.content.split(" ");
      if (params.length === 1) {
        games[msg.channel.id] = new TriviaGame(questions, 10, 10);
      } else if (params.length === 2) {
        games[msg.channel.id] = new TriviaGame(questions, parseInt(params[1]), 10);
      } else if (params.length === 3) {
        games[msg.channel.id] = new TriviaGame(questions, parseInt(params[1]), parseInt(params[2]));
      } else {
        const embed = new Discord.MessageEmbed()
          .setColor("#ff0000")
          .setTitle("WHAT THE FLIPPY FLACK ARE YOU DOING")
          .setDescription("uh whenever the degenerate creator of this makes a help message, use that")
        msg.channel.send(embed);
        return;  
      }
      const embed = new Discord.MessageEmbed()
        .setColor("#5f0f22")
        .setTitle("QUESTION TIME")
        .setAuthor(`follow ${process.env.ACCOUNT} ;)`, process.env.PFP_LINK, process.env.LINK)
        .setDescription(games[msg.channel.id].getQuestion())
        .addFields(
          {name:"Category: ", value:games[msg.channel.id].getTopic(), inline:true},
          {name:"Difficuty: ", value:games[msg.channel.id].getDifficulty(), inline:true}
        )
      
      msg.channel.send(embed);
    }
  }
  if ((games[msg.channel.id] !== undefined) && (games[msg.channel.id].checkAnswer(msg.content))) {
    msg.reply("congrats!");
    await updateUsers(google_sheets, msg.author.id);
    if (games[msg.channel.id].isRoundOver()) {
      games[msg.channel.id] = undefined;
      const embed = new Discord.MessageEmbed()
        .setTitle("Good game!")
        .setColor("#5f0f22")
        .setDescription(`Don't forget to follow [${process.env.ACCOUNT}](${process.env.LINK})`);
      msg.channel.send(embed);
    } else {
      const embed = new Discord.MessageEmbed()
      .setColor("#5f0f22")
      .setTitle("QUESTION TIME")
      .setAuthor(`follow ${process.env.ACCOUNT} ;)`, process.env.PFP_LINK, process.env.LINK)
      .setDescription(games[msg.channel.id].getQuestion())
      .addFields(
        {name:"Category:", value:games[msg.channel.id].getTopic(), inline:true},
        {name:"Difficuty:", value:games[msg.channel.id].getDifficulty(), inline:true}
      )
      
      msg.channel.send(embed);
    }
  }
});

client.login(process.env.TOKEN);
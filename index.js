/**
 * @fileoverview the file to run for madness
 * @version 1.1.1(?))
 */
// allows access of .env content
require('dotenv').config();
//express, runs on port 3000
const express = require('express');
const app = express();
const port = 3000;
//will send this once bot is online
app.get('/', function (req, res) {
  res.send('this is a cool bot');
});
//listens at the port 
app.listen(port, function() {
  console.log(`listening at port ${port}`);
});

class TriviaGame {
  /**
   * Constructor for TriviaGame class.
   * @class
   * @param {Array<String>} questions array of questions to ask
   * @param {int} questionCount number of questions to ask
   * @param {int} time how many seconds to give before giving the answre
   * @param {Discord channel object} channel the channel the game is running in 
   */
  constructor (questions, questionCount, time, channel) {
    this.questions = questions;
    this.questionCount = questionCount;
    this.time = time;
    this.channel = channel;
    this.curQuestionIndex = Math.floor(Math.random() * this.questions.length);
    this.questionTime = Date.now();
    this.checkTime();
  }
  /**
   * Gets the current question.
   * @returns the current question
   */
  getQuestion() {
    return this.questions[this.curQuestionIndex][0];
  }
  /**
   * Gets the difficulty of the current question.
   * @returns difficulty of current question
   */
  getDifficulty() {
    return this.questions[this.curQuestionIndex][2];
  }
  /**
   * Gets topic of current question.
   * @returns topic of the current question
   */
  getTopic() {
    return this.questions[this.curQuestionIndex][3];
  }
  /**
   * Checks if answer is correct.
   * @param {String} submission 
   * @returns true if answer is right, false otherwise
   */
  checkAnswer(submission) {
    if(submission.toLowerCase().includes(this.questions[this.curQuestionIndex][1].toLowerCase())) {
      this.questionCount--;
      this.curQuestionIndex = Math.floor(Math.random() * this.questions.length);
      this.questionTime = Date.now();
      this.checkTime();
      return true;
    } else {
      return false;
    }
  }
  /**
   * Checks if round should be over
   * @returns true if there are no more questions left this round
   * @returns false if there's still more questions
   */
  isRoundOver() {
    if (this.questionCount <= 0) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * Sends the answer if the time is out
   * @todo: make this a better function since this really sucks
   */
  checkTime() {
    if ((Date.now() - this.questionTime) >= this.time*1000) {
      const answerEmbed = new Discord.MessageEmbed()
        .setColor("#5f0f22")
        .setDescription(`Answer: ${this.questions[this.curQuestionIndex][1]}`)
      this.channel.send(answerEmbed);
      this.questionCount--;
      this.curQuestionIndex = Math.floor(Math.random() * this.questions.length);
      this.questionTime = Date.now();
      if (this.isRoundOver()) {
        games[this.channel.id] = undefined;
      } else {
        const questionEmbed = new Discord.MessageEmbed()
        .setColor("#5f0f22")
        .setTitle("QUESTION TIME")
        .setAuthor(`follow ${process.env.ACCOUNT} ;)`, process.env.PFP_LINK, process.env.LINK)
        .setDescription(this.getQuestion())
        .addFields(
          {name:"Category: ", value:this.getTopic(), inline:true},
          {name:"Difficuty: ", value:this.getDifficulty(), inline:true}
        )
      
      this.channel.send(questionEmbed);
      }
    }
  }
}

// the questions spreadsheet
var questions;
// keeps track of the games going on
var games = new Object();

// determine what api to use
const {google} = require('googleapis');
const google_sheets = new google.auth.JWT(
  process.env.EMAIL, null, process.env.PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets']
);

// log in
google_sheets.authorize( (err, tokens) =>{
  if (err) {
    console.log(err);
    return;
  }else{
    console.log("ack everything worked and nothing broke");
    gsrun(google_sheets);
  }
});

/**
 * Load up the questions
 * @param {google} cl the client to log in with
 */
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

/**
 * updates the user scores (increases by one)
 * @param {google} cl the client to log in with
 * @param {int} user Discord user ID
 */
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

/**
 * gets the rank and scores of the user
 * @param {google} cl client
 * @param {int} user ID
 * @returns array of rank and scores
 */
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

/**
 * Clears scores of a certain row
 * @param {google} cl google client
 * @param {int} row which row to clear
 * @todo something about either the function or calling it isn't working, look into later
 */
async function updateUserScores(cl, row) {
  const gsapi = google.sheets({version: "v4", auth: cl});
  const id = process.env.SHEET_ID;
  const readUsers = {
    spreadsheetId: id,
    range: "Users!A2:E2000"
  };
  let userData = (await gsapi.spreadsheets.values.get(readUsers)).data.values;
  for (let i = 0;i < userData.length;i++) {
    userDate[i][row] = 0;
  }
  const spreadSheetUsers = {
    spreadsheetId: id,
    range: "Users!A2",
    valueInputOption: "USER_ENTERED",
    resource: {values: userData}
  };
  gsapi.spreadsheets.values.update(spreadSheetUsers);
}

var day = new Date().getDate();
var week = new Date().getDay();
var month = new Date().getMonth();

/**
 * Checks up on stuff every second because this is clearly the right way to do background tasks
 */
function dumbThingToExecuteEverySecond() {
  let date = new Date();
  if (date.getDate() != day) {
    day = date.getDate();
    updateUserScores(google_sheets, 4);
  }
  if (date.getDay() != week) {
    week = date.getDay();
    if ((date.getDay() == 0)) {
      updateUserScores(google_sheets, 3);
    }
  }
  if (date.getMonth() != month) {
    month = date.getMonth();
    updateUserScores(google_sheets, 2);
  }
  for (const id in games) {
    if (games[id] !== undefined) {
      games[id].checkTime();
    }
  }
  setTimeout(dumbThingToExecuteEverySecond, 1000);
}

dumbThingToExecuteEverySecond();

const Discord = require('discord.js');
const client = new Discord.Client();
const prefix = "!";

// when bot is ready
client.on('ready', () => {
  client.user.setPresence({
    activity: {
      name: "trivia"
    }
  });
  console.log(`Logged in as ${client.user.tag}!`);
});

// when bot receives message
client.on('message', async (msg) => {
  if (msg.content === prefix.concat("help")) {
    const embed = new Discord.MessageEmbed()
      .setColor("#5f0f22")
      .setTitle("Help Request!!!")
      .setDescription("<flag=10> means flag defaults to 10 if not otherwise specified")
      .addFields(
        {name:`${prefix}help`, value: "shows this message and is otherwise a useless command :innocent:", inline:false},
        {name:`${prefix}trivia <questions=10> <seconds=10>`, value: "starts a trivia round with some questions and some time between questions", inline:false},
        {name:`${prefix}stop`, value: "stops the current trivia round", inline:false},
        {name:`${prefix}rank`, value: "shows your rank as well as your scores", inline:false}
      )
    msg.channel.send(embed);
  }
  if (msg.content === prefix.concat("stop")) {
    games[msg.channel.id] = undefined;
    const embed = new Discord.MessageEmbed()
      .setColor("#5f0f22")
      .setDescription("game stoped")
    msg.channel.send(embed);
  }

  /**
   * @todo create the scoreboard :P
   */
  if (msg.content === prefix.concat("scoreboard")) {

  }

  if (msg.content === prefix.concat("rank")) {
    const rankAndScore = await getRankAndScore(google_sheets, msg.author.id);
    if (rankAndScore === null) {
      const embed = new Discord.MessageEmbed()
        .setColor("#ff0000")
        .setDescription(":( you're not ranked yet")
      msg.channel.send(embed);
    } else {
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
        games[msg.channel.id] = new TriviaGame(questions, 10, 10, msg.channel);
      } else if (params.length === 2) {
        games[msg.channel.id] = new TriviaGame(questions, parseInt(params[1]), 10, msg.channel);
      } else if (params.length === 3) {
        games[msg.channel.id] = new TriviaGame(questions, parseInt(params[1]), parseInt(params[2]), msg.channel);
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

// log into discord
client.login(process.env.TOKEN);
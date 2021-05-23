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

const {google} = require('googleapis');
const creds = require('./credentials.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async (msg) => {
  if (msg.content === 'ping') {
    msg.reply('Pong!');
  }
});

client.login(process.env.TOKEN);
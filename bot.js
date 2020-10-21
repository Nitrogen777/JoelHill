const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const authData = JSON.parse(fs.readFileSync('auth.json'))
const token = authData.token

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    console.log(msg.content)
})
client.login(token);

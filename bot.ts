import Discord = require('discord.js');
import pm2 = require('@pm2/io')
const client = new Discord.Client();
import fs = require('fs');
import mariadb = require("mariadb");
const settings = JSON.parse(fs.readFileSync('settings.json').toString())
const token = settings.token
const pool = mariadb.createPool({
    user: settings.DBuser,
    password: settings.DBpass,
    database: settings.DBdatabase
});
const rightNumberFrequency = pm2.meter({
    name: 'Right Number Frequency'
})
const wrongNumberFrequency = pm2.meter({
    name: 'Wrong Number Frequency'
})
const help = `\`\`\`css\nWelcome to Joel Hill, the counting bot!\nCommands:
${settings.prefix}help: display this message
${settings.prefix}info: info about the ongoing counting process
${settings.prefix}channel: set the server's counting channel (ADMIN ONLY!)
${settings.prefix}number: set the server's last number (ADMIN ONLY!)
${settings.prefix}goal: set the server's goal (ADMIN ONLY!)\`\`\``

var serverDictionary:{[key: string]: {id: string,
     channel: string, 
     last_number: number, 
     goal: number, 
     last_sender: string,
     last_message: string}} = {}

function serverExists(serverId) {
    return serverId in serverDictionary;
}

async function getServers(){
    let conn = await pool.getConnection();
    let content = await conn.query("SELECT * FROM servers;");
    conn.end()
    return content;
}

function getInfo(serverId) {
    let info = serverDictionary[serverId]
    return `\`\`\`
Counting channel: <#${info.channel}>
Current Number: ${info.last_number}
Goal: ${info.goal}
Numbers left: ${info.goal - info.last_number}\`\`\``
}

async function addServer(channelId, serverId) {
    let channel;
    try {
        channel = await client.channels.fetch(channelId)
    }catch(err){
        return "Channel not found"
    }
    let conn = await pool.getConnection();
    if(serverExists(serverId)){
        await conn.query("UPDATE servers SET channel = ? WHERE id = ?", [channelId, serverId]);
        conn.end()
        return `Set server's counting channel to ${channel.toString()}`;
    }
    await conn.query("INSERT INTO servers VALUES(?,?,?,?,?,?);", [serverId, channelId, 0, 100, null, null]);
    conn.end()
    return `Set server's counting channel to ${channel.toString()}`;
}

async function updateNumber(number, serverId) {
    if(!isNumber(number.toString())){
        return "Not a number"
    }
    let conn = await pool.getConnection();
    if(serverExists(serverId)){
        await conn.query("UPDATE servers SET last_number = ? WHERE id = ?", [number, serverId]);
        conn.end()
        serverDictionary[serverId].last_number = number;
        return `Set server's last number to ${number}`;
    }
    conn.end()
    return `Set the server's counting channel first!`;
}

async function updateGoal(goal, serverId) {
    if(!isNumber(goal.toString())){
        return "Not a number"
    }
    let conn = await pool.getConnection();
    if(serverExists(serverId)){
        await conn.query("UPDATE servers SET goal = ? WHERE id = ?", [goal, serverId]);
        conn.end()
        serverDictionary[serverId].goal = goal;
        return `Set server's goal to ${goal}`;
    }
    conn.end()
    return `Set the server's counting channel first!`;
}

async function updateSender(sender, serverId) {
    let conn = await pool.getConnection();
    if(serverExists(serverId)){
        await conn.query("UPDATE servers SET last_sender = ? WHERE id = ?", [sender, serverId]);
        conn.end()
        serverDictionary[serverId].last_sender = sender;
    }
    conn.end()
}

async function updateMessage(message, serverId) {
    let conn = await pool.getConnection();
    if(serverExists(serverId)){
        await conn.query("UPDATE servers SET last_message = ? WHERE id = ?", [message, serverId]);
        conn.end()
        serverDictionary[serverId].last_message = message;
    }
    conn.end()
}

async function handleCommand(msg){
    if(msg.content.startsWith(settings.prefix)){
        if(msg.content === `${settings.prefix}help`){
            msg.channel.send(help)
            return
        }
        if(msg.content === `${settings.prefix}info`){
            msg.channel.send(getInfo(msg.guild.id))
            return
        }
        if (!msg.member.hasPermission("ADMINISTRATOR")){
            msg.reply("You are not an admin!")
            return
        }
        let contentArr = msg.content.split(" ")
        if(contentArr[0] === `${settings.prefix}channel`){
            let response = await addServer(contentArr[1], msg.guild.id)
            msg.reply(response)
        }else if(contentArr[0] === `${settings.prefix}number`){
            let response = await updateNumber(parseInt(contentArr[1]), msg.guild.id)
            msg.reply(response)
        }else if(contentArr[0] === `${settings.prefix}goal`){
            let response = await updateGoal(contentArr[1], msg.guild.id)
            msg.reply(response)
        }
    }
}

function isNumber(content){
    let contentArr = content.split(" ")
    return /\d/.test(contentArr[0]);
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    let servers = await getServers();
    servers.forEach(element => {
        serverDictionary[element.id] = element;
    });
});

client.on('message', async msg => {
    if(msg.author.bot) return;
    if(serverExists(msg.guild.id)){
        let serverInfo = serverDictionary[msg.guild.id]
        if(msg.channel.id === serverInfo.channel){
            if(isNumber(msg.content.toString())){
                if(msg.member.id === serverInfo.last_sender){
                    msg.reply("You can't send a number twice in a row!").then(mesg => mesg.delete({timeout: 10000}))
                    await msg.delete()
                    wrongNumberFrequency.mark()
                    return
                }
                let number = parseInt(msg.content.split(" ")[0])
                if(number === serverInfo.last_number + 1){
                    await updateNumber(number, msg.guild.id)
                    await updateSender(msg.member.id, msg.guild.id)
                    await updateMessage(msg.id, msg.guild.id)
                    rightNumberFrequency.mark()
                    if(number%100 === 0 || number === serverInfo.goal){
                        await msg.react('🎉')
                        if(number%1000 === 0 || number === serverInfo.goal){
                            await msg.react('⭐')
                        }
                    }
                    if(number === serverInfo.goal){
                        msg.channel.send("Goal reached!")
                    }
                }else{
                    msg.reply("Thats not the correct number!").then(mesg => mesg.delete({timeout: 10000}))
                    await msg.delete()
                    wrongNumberFrequency.mark()
                }
            }else{
                msg.reply("Thats not a number!").then(mesg => mesg.delete({timeout: 10000}))
                await msg.delete()
                wrongNumberFrequency.mark()
            }
        }else{
            await handleCommand(msg)
        }
    }else{
        await handleCommand(msg)
    }
})

client.on('messageDelete', async msg => {
    if(msg.author.bot) return;
    if(serverExists(msg.guild.id)){
        let serverInfo = serverDictionary[msg.guild.id]
        if(msg.channel.id === serverInfo.channel){
            if(isNumber(msg.content.toString())){
                let number = parseInt(msg.content.split(" ")[0])
                if(msg.id === serverInfo.last_message){
                    msg.channel.send(`${number}`)
                }
            }
        }
    }
})
client.login(token);
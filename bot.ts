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
${settings.prefix}level: get your counting score and rank
${settings.prefix}scoreboard: the server's counting scoreboard
${settings.prefix}channel: set the server's counting channel (ADMIN ONLY!)
${settings.prefix}number: set the server's last number (ADMIN ONLY!)
${settings.prefix}goal: set the server's goal (ADMIN ONLY!)\`\`\``

var serverDictionary: {
    [key: string]: {
        id: string,
        channel: string,
        last_number: number,
        goal: number,
        last_sender: string,
        last_message: string
    }
} = {}

var userScores: { user_id: string, server_id: string, score: number }[] = []

function serverExists(serverId) {
    return serverId in serverDictionary;
}
function userExists(userId, serverId) {
    return userScores.filter(element => element.user_id === userId)
        .filter(element => element.server_id === serverId).length > 0
}

async function getServers() {
    let conn = await pool.getConnection();
    let content = await conn.query("SELECT * FROM servers;");
    conn.end()
    return content;
}

async function getUserScores() {
    let conn = await pool.getConnection();
    let content = await conn.query("SELECT * FROM user_scores;");
    conn.end()
    return content;
}

function getInfo(serverId) {
    if (!serverExists(serverId)) {
        return `Set the server's channel first!`
    }
    let info = serverDictionary[serverId]
    return `\`\`\`
Counting channel: <#${info.channel}>
Current Number: ${info.last_number}
Goal: ${info.goal}
Numbers left: ${info.goal - info.last_number}\`\`\``
}

function getScore(msg) {
    return new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle(`Score for ${msg.member.user.username}`)
        .setAuthor("Joel Hill", client.user.avatarURL())
        .setThumbnail(msg.member.user.avatarURL())
        .setDescription(getUserScore(msg.member.id, msg.guild.id))
        .addFields({
            name: 'User Rank', value: getServerScoreboard(msg.guild.id)
                .findIndex(element => element.user_id === msg.member.id) + 1
        })
}

function getList(msg) {
    let list = ""
    getServerScoreboard(msg.guild.id).forEach((element, i) => {
        list += `${i + 1}. ` + client.users.cache.find(user => user.id === element.user_id).username +
            ` - ${getUserScore(element.user_id, element.server_id)}` + "\n"
    })
    return new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setAuthor("Joel Hill", client.user.avatarURL())
        .addFields({
            name: 'Scoreboard', value: list
        })
}

function getUserScore(userId, serverId) {
    return userScores.filter(element => element.user_id === userId)
        .filter(element => element.server_id === serverId)[0].score
}

function getServerScoreboard(serverId) {
    return userScores.filter((element => element.server_id === serverId))
        .sort((a, b) => (a.score > b.score) ? 1 : -1).slice(0, 25)
}

function setUserScore(userId, serverId, score) {
    userScores.forEach(element => {
        if (element.user_id === userId && element.server_id === serverId) {
            element.score = score
        }
    })
}

async function addServer(channelId, serverId) {
    let channel;
    try {
        channel = await client.channels.fetch(channelId)
    } catch (err) {
        return "Channel not found"
    }
    let conn = await pool.getConnection();
    if (serverExists(serverId)) {
        await conn.query("UPDATE servers SET channel = ? WHERE id = ?", [channelId, serverId]);
        serverDictionary[serverId].channel = channelId;
        conn.end()
        return `Set server's counting channel to ${channel.toString()}`;
    }
    await conn.query("INSERT INTO servers VALUES(?,?,?,?,?,?);", [serverId, channelId, 0, 100, null, null]);
    serverDictionary[serverId] = {
        id: serverId,
        channel: channelId,
        last_number: 0,
        goal: 100,
        last_sender: null,
        last_message: null
    };
    conn.end()
    return `Set server's counting channel to ${channel.toString()}`;
}

async function incrementUser(userId, serverId) {
    let conn = await pool.getConnection();
    if (userExists(userId, serverId)) {
        let new_score = getUserScore(userId, serverId) + 1
        await conn.query("UPDATE user_scores SET score = ? WHERE user_id = ? and server_id = ?",
            [new_score, userId, serverId]);
        setUserScore(userId, serverId, new_score)
        conn.end()
    }
    await conn.query("INSERT INTO user_scores VALUES(?,?,?);", [userId, serverId, 1]);
    userScores.push({ user_id: userId, server_id: serverId, score: 1 })
    conn.end()
}

async function updateNumber(number, serverId) {
    if (!isNumber(number.toString())) {
        return "Not a number"
    }
    let conn = await pool.getConnection();
    if (serverExists(serverId)) {
        await conn.query("UPDATE servers SET last_number = ? WHERE id = ?", [number, serverId]);
        conn.end()
        serverDictionary[serverId].last_number = number;
        return `Set server's last number to ${number}`;
    }
    conn.end()
    return `Set the server's counting channel first!`;
}

async function updateGoal(goal, serverId) {
    if (!isNumber(goal.toString())) {
        return "Not a number"
    }
    let conn = await pool.getConnection();
    if (serverExists(serverId)) {
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
    if (serverExists(serverId)) {
        await conn.query("UPDATE servers SET last_sender = ? WHERE id = ?", [sender, serverId]);
        conn.end()
        serverDictionary[serverId].last_sender = sender;
    }
    conn.end()
}

async function updateMessage(message, serverId) {
    let conn = await pool.getConnection();
    if (serverExists(serverId)) {
        await conn.query("UPDATE servers SET last_message = ? WHERE id = ?", [message, serverId]);
        conn.end()
        serverDictionary[serverId].last_message = message;
    }
    conn.end()
}

async function handleCommand(msg) {
    if (msg.content.startsWith(settings.prefix)) {
        if (msg.content === `${settings.prefix}help`) {
            msg.channel.send(help)
            return
        }
        if (msg.content === `${settings.prefix}info`) {
            msg.channel.send(getInfo(msg.guild.id))
            return
        }
        if (msg.content === `${settings.prefix}level`) {
            msg.channel.send(getScore(msg))
            return
        }
        if (msg.content === `${settings.prefix}scoreboard`) {
            msg.channel.send(getList(msg))
            return
        }
        if (!msg.member.hasPermission("ADMINISTRATOR")) {
            msg.reply("You are not an admin!")
            return
        }
        let contentArr = msg.content.split(" ")
        if (contentArr[0] === `${settings.prefix}channel`) {
            let response = await addServer(contentArr[1], msg.guild.id)
            msg.reply(response)
        } else if (contentArr[0] === `${settings.prefix}number`) {
            let response = await updateNumber(parseInt(contentArr[1]), msg.guild.id)
            msg.reply(response)
        } else if (contentArr[0] === `${settings.prefix}goal`) {
            let response = await updateGoal(contentArr[1], msg.guild.id)
            msg.reply(response)
        }
    }
}

function isNumber(content) {
    let contentArr = content.split(" ")
    return /\d/.test(contentArr[0]);
}

client.on('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    let servers = await getServers();
    servers.forEach(element => {
        serverDictionary[element.id] = element;
    });
    let scores = await getUserScores();
    scores.forEach(element => {
        userScores.push(element);
    });
});

client.on('message', async msg => {
    if (msg.author.bot) return;
    if (serverExists(msg.guild.id)) {
        let serverInfo = serverDictionary[msg.guild.id]
        if (msg.channel.id === serverInfo.channel) {
            if (isNumber(msg.content.toString())) {
                if (msg.member.id === serverInfo.last_sender) {
                    msg.reply("You can't send a number twice in a row!").then(mesg => mesg.delete({ timeout: 10000 }))
                    await msg.delete()
                    wrongNumberFrequency.mark()
                    return
                }
                let number = parseInt(msg.content.split(" ")[0])
                if (number === serverInfo.last_number + 1) {
                    await updateNumber(number, msg.guild.id)
                    await updateSender(msg.member.id, msg.guild.id)
                    await updateMessage(msg.id, msg.guild.id)
                    await incrementUser(msg.member.id, msg.guild.id)
                    rightNumberFrequency.mark()
                    if (number % 100 === 0 || number === serverInfo.goal) {
                        await msg.react('🎉')
                        if (number % 1000 === 0 || number === serverInfo.goal) {
                            await msg.react('⭐')
                        }
                    }
                    if (number === serverInfo.goal) {
                        msg.channel.send("Goal reached!")
                    }
                } else {
                    msg.reply("Thats not the correct number!").then(mesg => mesg.delete({ timeout: 10000 }))
                    await msg.delete()
                    wrongNumberFrequency.mark()
                }
            } else {
                msg.reply("Thats not a number!").then(mesg => mesg.delete({ timeout: 10000 }))
                await msg.delete()
                wrongNumberFrequency.mark()
            }
        } else {
            await handleCommand(msg)
        }
    } else {
        await handleCommand(msg)
    }
})

client.on('messageDelete', async msg => {
    if (msg.author.bot) return;
    if (serverExists(msg.guild.id)) {
        let serverInfo = serverDictionary[msg.guild.id]
        if (msg.channel.id === serverInfo.channel) {
            if (isNumber(msg.content.toString())) {
                let number = parseInt(msg.content.split(" ")[0])
                if (msg.id === serverInfo.last_message) {
                    msg.channel.send(`${number}`)
                }
            }
        }
    }
})
client.login(token);
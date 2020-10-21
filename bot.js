const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const mariadb = require("mariadb");
const settings = JSON.parse(fs.readFileSync('settings.json'))
const token = settings.token
const pool = mariadb.createPool({
    user: settings.DBuser,
    password: settings.DBpass,
    database: settings.DBdatabase
});

async function serverExists(serverId) {
    let conn = await pool.getConnection();
    let content = await conn.query("SELECT * FROM servers WHERE id = ?;", [serverId]);
    conn.end()
    return content.length >= 1;
}

async function getServer(serverId) {
    let conn = await pool.getConnection();
    let content = await conn.query("SELECT * FROM servers WHERE id = ?;", [serverId]);
    conn.end()
    return content[0];
}

async function addServer(channelId, serverId) {
    let channel;
    try {
        channel = await client.channels.fetch(channelId)
    }catch(err){
        return "Channel not found"
    }
    let conn = await pool.getConnection();
    if(await serverExists(serverId)){
        await conn.query("UPDATE servers SET channel = ? WHERE id = ?", [channelId, serverId]);
        conn.end()
        return `Set server's counting channel to ${channel.toString()}`;
    }
    await conn.query("INSERT INTO servers VALUES(?,?,?,?,?);", [serverId, channelId, 0, 100, null]);
    conn.end()
    return `Set server's counting channel to ${channel.toString()}`;
}

async function updateNumber(number, serverId) {
    if(!isNumber(number)){
        return "Not a number"
    }
    let conn = await pool.getConnection();
    if(await serverExists(serverId)){
        await conn.query("UPDATE servers SET last_number = ? WHERE id = ?", [number, serverId]);
        conn.end()
        return `Set server's last number to ${number}`;
    }
    conn.end()
    return `Set the server's counting channel first!`;
}

async function updateSender(sender, serverId) {
    let conn = await pool.getConnection();
    if(await serverExists(serverId)){
        await conn.query("UPDATE servers SET last_sender = ? WHERE id = ?", [sender, serverId]);
        conn.end()
    }
    conn.end()
}

async function handleCommand(msg){
    if(msg.content.startsWith(settings.prefix)){
        if (!msg.member.hasPermission("ADMINISTRATOR")){
            msg.reply("You are not an admin!")
            return
        }
        let contentArr = msg.content.split(" ")
        if(contentArr[0] === `${settings.prefix}channel`){
            let response = await addServer(contentArr[1], msg.guild.id)
            msg.reply(response)
        }else if(contentArr[0] === `${settings.prefix}number`){
            let response = await updateNumber(contentArr[1], msg.guild.id)
            msg.reply(response)
        }
    }
}

function isNumber(content){
    let contentArr = content.split(" ")
    return /\d/.test(contentArr[0]);
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', async msg => {
    if(msg.author.bot) return;
    if(await serverExists(msg.guild.id)){
        if(msg.channel.id === (await getServer(msg.guild.id)).channel){
            if(isNumber(msg.content)){
                if(msg.member.id === (await getServer(msg.guild.id)).last_sender){
                    msg.reply("You can't send a number twice in a row!").then(mesg => mesg.delete({timeout: 10000}))
                    await msg.delete()
                    return
                }
                let number = parseInt(msg.content.split(" ")[0])
                if(number === (await getServer(msg.guild.id)).last_number + 1){
                    await updateNumber(`${number}`, msg.guild.id)
                    await updateSender(msg.member.id, msg.guild.id)
                }else{
                    msg.reply("Thats not the correct number!").then(mesg => mesg.delete({timeout: 10000}))
                    await msg.delete()
                }
            }else{
                msg.reply("Thats not a number!").then(mesg => mesg.delete({timeout: 10000}))
                await msg.delete()
            }
        }else{
            await handleCommand(msg)
        }
    }else{
        await handleCommand(msg)
    }
})
client.login(token);

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var Discord = require("discord.js");
var pm2 = require("@pm2/io");
var client = new Discord.Client();
var fs = require("fs");
var mariadb = require("mariadb");
var settings = JSON.parse(fs.readFileSync('settings.json').toString());
var token = settings.token;
var pool = mariadb.createPool({
    user: settings.DBuser,
    password: settings.DBpass,
    database: settings.DBdatabase
});
var rightNumberFrequency = pm2.meter({
    name: 'Right Number Frequency'
});
var wrongNumberFrequency = pm2.meter({
    name: 'Wrong Number Frequency'
});
var help = "```css\nWelcome to Joel Hill, the counting bot!\nCommands:\n" + settings.prefix + "help: display this message\n" + settings.prefix + "info: info about the ongoing counting process\n" + settings.prefix + "level: get your counting score and rank\n" + settings.prefix + "scoreboard: the server's counting scoreboard\n" + settings.prefix + "channel: set the server's counting channel (ADMIN ONLY!)\n" + settings.prefix + "number: set the server's last number (ADMIN ONLY!)\n" + settings.prefix + "goal: set the server's goal (ADMIN ONLY!)```";
var serverDictionary = {};
var userScores = [];
function serverExists(serverId) {
    return serverId in serverDictionary;
}
function userExists(userId, serverId) {
    return userScores.filter(function (element) { return element.user_id === userId; })
        .filter(function (element) { return element.server_id === serverId; }).length > 0;
}
function getServers() {
    return __awaiter(this, void 0, void 0, function () {
        var conn, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    return [4 /*yield*/, conn.query("SELECT * FROM servers;")];
                case 2:
                    content = _a.sent();
                    conn.end();
                    return [2 /*return*/, content];
            }
        });
    });
}
function getUserScores() {
    return __awaiter(this, void 0, void 0, function () {
        var conn, content;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    return [4 /*yield*/, conn.query("SELECT * FROM user_scores;")];
                case 2:
                    content = _a.sent();
                    conn.end();
                    return [2 /*return*/, content];
            }
        });
    });
}
function getInfo(serverId) {
    if (!serverExists(serverId)) {
        return "Set the server's channel first!";
    }
    var info = serverDictionary[serverId];
    return "```\nCounting channel: <#" + info.channel + ">\nCurrent Number: " + info.last_number + "\nGoal: " + info.goal + "\nNumbers left: " + (info.goal - info.last_number) + "```";
}
function getScore(msg, user) {
    if (!userExists(user.id, msg.guild.id)) {
        return "Can't find user! Perhaps they haven't counted yet?";
    }
    return new Discord.MessageEmbed()
        .setColor('#0099ff')
        .setTitle("Score for " + user.username)
        .setAuthor("Joel Hill", client.user.avatarURL())
        .setThumbnail(user.avatarURL())
        .setDescription(getUserScore(user.id, msg.guild.id))
        .addFields({
        name: 'User Rank',
        value: getServerScoreboard(msg.guild.id)
            .findIndex(function (element) { return element.user_id === user.id; }) + 1
    });
}
function getScoreboardString(server, amount) {
    return __awaiter(this, void 0, void 0, function () {
        var list, names;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    list = "";
                    names = [];
                    getServerScoreboard(server.id).slice(0, amount).forEach(function (element, i) { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            names.push(server.members.fetch(element.user_id).then(function (member) {
                                return i + 1 + ". " + member.user.username + " - " + getUserScore(element.user_id, element.server_id) + "\n";
                            }));
                            return [2 /*return*/];
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(names).then(function (values) { return values.forEach(function (element) {
                            list = list.concat(element);
                        }); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, list];
            }
        });
    });
}
function getList(msg) {
    return __awaiter(this, void 0, void 0, function () {
        var list;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getScoreboardString(msg.guild, 25)];
                case 1:
                    list = _a.sent();
                    return [2 /*return*/, new Discord.MessageEmbed()
                            .setColor('#0099ff')
                            .setAuthor("Joel Hill", client.user.avatarURL())
                            .addFields({
                            name: 'Scoreboard', value: list
                        })];
            }
        });
    });
}
function getUserScore(userId, serverId) {
    return userScores.filter(function (element) { return element.user_id === userId; })
        .filter(function (element) { return element.server_id === serverId; })[0].score;
}
function getServerScoreboard(serverId) {
    return userScores.filter((function (element) { return element.server_id === serverId; }))
        .sort(function (a, b) { return (a.score < b.score) ? 1 : -1; });
}
function setUserScore(userId, serverId, score) {
    userScores.forEach(function (element) {
        if (element.user_id === userId && element.server_id === serverId) {
            element.score = score;
        }
    });
}
function addServer(channelId, serverId) {
    return __awaiter(this, void 0, void 0, function () {
        var channel, err_1, conn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, client.channels.fetch(channelId)];
                case 1:
                    channel = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _a.sent();
                    return [2 /*return*/, "Channel not found"];
                case 3: return [4 /*yield*/, pool.getConnection()];
                case 4:
                    conn = _a.sent();
                    if (!serverExists(serverId)) return [3 /*break*/, 6];
                    return [4 /*yield*/, conn.query("UPDATE servers SET channel = ? WHERE id = ?", [channelId, serverId])];
                case 5:
                    _a.sent();
                    serverDictionary[serverId].channel = channelId;
                    conn.end();
                    return [2 /*return*/, "Set server's counting channel to " + channel.toString()];
                case 6: return [4 /*yield*/, conn.query("INSERT INTO servers VALUES(?,?,?,?,?,?);", [serverId, channelId, 0, 100, null, null])];
                case 7:
                    _a.sent();
                    serverDictionary[serverId] = {
                        id: serverId,
                        channel: channelId,
                        last_number: 0,
                        goal: 100,
                        last_sender: null,
                        last_message: null
                    };
                    conn.end();
                    return [2 /*return*/, "Set server's counting channel to " + channel.toString()];
            }
        });
    });
}
function incrementUser(userId, serverId, number) {
    return __awaiter(this, void 0, void 0, function () {
        var conn, new_score;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    if (!userExists(userId, serverId)) return [3 /*break*/, 3];
                    new_score = getUserScore(userId, serverId) + number;
                    return [4 /*yield*/, conn.query("UPDATE user_scores SET score = ? WHERE user_id = ? and server_id = ?", [new_score, userId, serverId])];
                case 2:
                    _a.sent();
                    setUserScore(userId, serverId, new_score);
                    conn.end();
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, conn.query("INSERT INTO user_scores VALUES(?,?,?);", [userId, serverId, 1])];
                case 4:
                    _a.sent();
                    userScores.push({ user_id: userId, server_id: serverId, score: number });
                    conn.end();
                    _a.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    });
}
function updateNumber(number, serverId) {
    return __awaiter(this, void 0, void 0, function () {
        var conn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isNumber(number.toString())) {
                        return [2 /*return*/, "Not a number"];
                    }
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    if (!serverExists(serverId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, conn.query("UPDATE servers SET last_number = ? WHERE id = ?", [number, serverId])];
                case 2:
                    _a.sent();
                    conn.end();
                    serverDictionary[serverId].last_number = number;
                    return [2 /*return*/, "Set server's last number to " + number];
                case 3:
                    conn.end();
                    return [2 /*return*/, "Set the server's counting channel first!"];
            }
        });
    });
}
function updateGoal(goal, serverId) {
    return __awaiter(this, void 0, void 0, function () {
        var conn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!isNumber(goal.toString())) {
                        return [2 /*return*/, "Not a number"];
                    }
                    return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    if (!serverExists(serverId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, conn.query("UPDATE servers SET goal = ? WHERE id = ?", [goal, serverId])];
                case 2:
                    _a.sent();
                    conn.end();
                    serverDictionary[serverId].goal = goal;
                    return [2 /*return*/, "Set server's goal to " + goal];
                case 3:
                    conn.end();
                    return [2 /*return*/, "Set the server's counting channel first!"];
            }
        });
    });
}
function updateSender(sender, serverId) {
    return __awaiter(this, void 0, void 0, function () {
        var conn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    if (!serverExists(serverId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, conn.query("UPDATE servers SET last_sender = ? WHERE id = ?", [sender, serverId])];
                case 2:
                    _a.sent();
                    conn.end();
                    serverDictionary[serverId].last_sender = sender;
                    _a.label = 3;
                case 3:
                    conn.end();
                    return [2 /*return*/];
            }
        });
    });
}
function updateMessage(message, serverId) {
    return __awaiter(this, void 0, void 0, function () {
        var conn;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, pool.getConnection()];
                case 1:
                    conn = _a.sent();
                    if (!serverExists(serverId)) return [3 /*break*/, 3];
                    return [4 /*yield*/, conn.query("UPDATE servers SET last_message = ? WHERE id = ?", [message, serverId])];
                case 2:
                    _a.sent();
                    conn.end();
                    serverDictionary[serverId].last_message = message;
                    _a.label = 3;
                case 3:
                    conn.end();
                    return [2 /*return*/];
            }
        });
    });
}
function handleCommand(msg) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, contentArr, response, response, response;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!msg.content.startsWith(settings.prefix)) return [3 /*break*/, 8];
                    if (msg.content === settings.prefix + "help") {
                        msg.channel.send(help);
                        return [2 /*return*/];
                    }
                    if (msg.content === settings.prefix + "info") {
                        msg.channel.send(getInfo(msg.guild.id));
                        return [2 /*return*/];
                    }
                    if (msg.content.startsWith(settings.prefix + "level")) {
                        if (msg.mentions.users.size > 0) {
                            msg.channel.send(getScore(msg, msg.mentions.users.first(1)[0]));
                        }
                        else {
                            msg.channel.send(getScore(msg, msg.member.user));
                        }
                        return [2 /*return*/];
                    }
                    if (!(msg.content === settings.prefix + "scoreboard")) return [3 /*break*/, 2];
                    _b = (_a = msg.channel).send;
                    return [4 /*yield*/, getList(msg)];
                case 1:
                    _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/];
                case 2:
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        msg.reply("You are not an admin!");
                        return [2 /*return*/];
                    }
                    contentArr = msg.content.split(" ");
                    if (!(contentArr[0] === settings.prefix + "channel")) return [3 /*break*/, 4];
                    return [4 /*yield*/, addServer(contentArr[1], msg.guild.id)];
                case 3:
                    response = _c.sent();
                    msg.reply(response);
                    return [3 /*break*/, 8];
                case 4:
                    if (!(contentArr[0] === settings.prefix + "number")) return [3 /*break*/, 6];
                    return [4 /*yield*/, updateNumber(parseInt(contentArr[1]), msg.guild.id)];
                case 5:
                    response = _c.sent();
                    msg.reply(response);
                    return [3 /*break*/, 8];
                case 6:
                    if (!(contentArr[0] === settings.prefix + "goal")) return [3 /*break*/, 8];
                    return [4 /*yield*/, updateGoal(+contentArr[1], msg.guild.id)];
                case 7:
                    response = _c.sent();
                    msg.reply(response);
                    _c.label = 8;
                case 8: return [2 /*return*/];
            }
        });
    });
}
function isNumber(content) {
    var contentArr = content.split(" ");
    return /\d/.test(contentArr[0]);
}
client.on('ready', function () { return __awaiter(void 0, void 0, void 0, function () {
    var servers, scores;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Logged in as " + client.user.tag + "!");
                return [4 /*yield*/, getServers()];
            case 1:
                servers = _a.sent();
                servers.forEach(function (element) {
                    serverDictionary[element.id] = element;
                });
                return [4 /*yield*/, getUserScores()];
            case 2:
                scores = _a.sent();
                scores.forEach(function (element) {
                    userScores.push(element);
                });
                return [2 /*return*/];
        }
    });
}); });
client.on('message', function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var serverInfo, number;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (msg.author.bot)
                    return [2 /*return*/];
                if (!serverExists(msg.guild.id)) return [3 /*break*/, 24];
                serverInfo = serverDictionary[msg.guild.id];
                if (!(msg.channel.id === serverInfo.channel)) return [3 /*break*/, 21];
                if (!isNumber(msg.content.toString())) return [3 /*break*/, 18];
                if (!(msg.member.id === serverInfo.last_sender)) return [3 /*break*/, 2];
                msg.reply("You can't send a number twice in a row!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 1:
                _a.sent();
                wrongNumberFrequency.mark();
                return [2 /*return*/];
            case 2:
                number = parseInt(msg.content.split(" ")[0]);
                if (!(number === serverInfo.last_number + 1)) return [3 /*break*/, 15];
                return [4 /*yield*/, updateNumber(number, msg.guild.id)];
            case 3:
                _a.sent();
                return [4 /*yield*/, updateSender(msg.member.id, msg.guild.id)];
            case 4:
                _a.sent();
                return [4 /*yield*/, updateMessage(msg.id, msg.guild.id)];
            case 5:
                _a.sent();
                rightNumberFrequency.mark();
                if (!(number % 100 === 0 || number === serverInfo.goal)) return [3 /*break*/, 8];
                return [4 /*yield*/, msg.react('🎉')];
            case 6:
                _a.sent();
                if (!(number % 1000 === 0 || number === serverInfo.goal)) return [3 /*break*/, 8];
                return [4 /*yield*/, msg.react('⭐')];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                if (!(number % 1000 === 0)) return [3 /*break*/, 10];
                return [4 /*yield*/, incrementUser(msg.member.id, msg.guild.id, 50)];
            case 9:
                _a.sent();
                return [3 /*break*/, 14];
            case 10:
                if (!(number % 100 === 0)) return [3 /*break*/, 12];
                return [4 /*yield*/, incrementUser(msg.member.id, msg.guild.id, 5)];
            case 11:
                _a.sent();
                return [3 /*break*/, 14];
            case 12: return [4 /*yield*/, incrementUser(msg.member.id, msg.guild.id, 1)];
            case 13:
                _a.sent();
                _a.label = 14;
            case 14:
                if (number === serverInfo.goal) {
                    msg.channel.send("Goal reached!");
                }
                return [3 /*break*/, 17];
            case 15:
                msg.reply("Thats not the correct number!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 16:
                _a.sent();
                wrongNumberFrequency.mark();
                _a.label = 17;
            case 17: return [3 /*break*/, 20];
            case 18:
                msg.reply("Thats not a number!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 19:
                _a.sent();
                wrongNumberFrequency.mark();
                _a.label = 20;
            case 20: return [3 /*break*/, 23];
            case 21: return [4 /*yield*/, handleCommand(msg)];
            case 22:
                _a.sent();
                _a.label = 23;
            case 23: return [3 /*break*/, 26];
            case 24: return [4 /*yield*/, handleCommand(msg)];
            case 25:
                _a.sent();
                _a.label = 26;
            case 26: return [2 /*return*/];
        }
    });
}); });
client.on('messageDelete', function (msg) { return __awaiter(void 0, void 0, void 0, function () {
    var serverInfo, number;
    return __generator(this, function (_a) {
        if (msg.author.bot)
            return [2 /*return*/];
        if (serverExists(msg.guild.id)) {
            serverInfo = serverDictionary[msg.guild.id];
            if (msg.channel.id === serverInfo.channel) {
                if (isNumber(msg.content.toString())) {
                    number = parseInt(msg.content.split(" ")[0]);
                    if (msg.id === serverInfo.last_message) {
                        msg.channel.send("" + number);
                    }
                }
            }
        }
        return [2 /*return*/];
    });
}); });
client.login(token);

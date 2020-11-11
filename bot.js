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
var help = "```css\nWelcome to Joel Hill, the counting bot!\nCommands:\n" + settings.prefix + "help: display this message\n" + settings.prefix + "info: info about the ongoing counting process\n" + settings.prefix + "channel: set the server's counting channel (ADMIN ONLY!)\n" + settings.prefix + "number: set the server's last number (ADMIN ONLY!)\n" + settings.prefix + "goal: set the server's goal (ADMIN ONLY!)```";
var serverDictionary = {};
function serverExists(serverId) {
    return serverId in serverDictionary;
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
function getInfo(serverId) {
    var info = serverDictionary[serverId];
    return "```\nCounting channel: <#" + info.channel + ">\nCurrent Number: " + info.last_number + "\nGoal: " + info.goal + "\nNumbers left: " + (info.goal - info.last_number) + "```";
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
                    conn.end();
                    return [2 /*return*/, "Set server's counting channel to " + channel.toString()];
                case 6: return [4 /*yield*/, conn.query("INSERT INTO servers VALUES(?,?,?,?,?,?);", [serverId, channelId, 0, 100, null, null])];
                case 7:
                    _a.sent();
                    conn.end();
                    return [2 /*return*/, "Set server's counting channel to " + channel.toString()];
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
                    if (!isNumber(number)) {
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
                    if (!isNumber(goal)) {
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
        var contentArr, response, response, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!msg.content.startsWith(settings.prefix)) return [3 /*break*/, 6];
                    if (msg.content === settings.prefix + "help") {
                        msg.channel.send(help);
                        return [2 /*return*/];
                    }
                    if (msg.content === settings.prefix + "info") {
                        msg.channel.send(getInfo(msg.guild.id));
                        return [2 /*return*/];
                    }
                    if (!msg.member.hasPermission("ADMINISTRATOR")) {
                        msg.reply("You are not an admin!");
                        return [2 /*return*/];
                    }
                    contentArr = msg.content.split(" ");
                    if (!(contentArr[0] === settings.prefix + "channel")) return [3 /*break*/, 2];
                    return [4 /*yield*/, addServer(contentArr[1], msg.guild.id)];
                case 1:
                    response = _a.sent();
                    msg.reply(response);
                    return [3 /*break*/, 6];
                case 2:
                    if (!(contentArr[0] === settings.prefix + "number")) return [3 /*break*/, 4];
                    return [4 /*yield*/, updateNumber(contentArr[1], msg.guild.id)];
                case 3:
                    response = _a.sent();
                    msg.reply(response);
                    return [3 /*break*/, 6];
                case 4:
                    if (!(contentArr[0] === settings.prefix + "goal")) return [3 /*break*/, 6];
                    return [4 /*yield*/, updateGoal(contentArr[1], msg.guild.id)];
                case 5:
                    response = _a.sent();
                    msg.reply(response);
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
function isNumber(content) {
    var contentArr = content.split(" ");
    return /\d/.test(contentArr[0]);
}
client.on('ready', function () { return __awaiter(void 0, void 0, void 0, function () {
    var servers;
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
                if (!serverExists(msg.guild.id)) return [3 /*break*/, 18];
                serverInfo = serverDictionary[msg.guild.id];
                if (!(msg.channel.id === serverInfo.channel)) return [3 /*break*/, 15];
                if (!isNumber(msg.content)) return [3 /*break*/, 12];
                if (!(msg.member.id === serverInfo.last_sender)) return [3 /*break*/, 2];
                msg.reply("You can't send a number twice in a row!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 1:
                _a.sent();
                return [2 /*return*/];
            case 2:
                number = parseInt(msg.content.split(" ")[0]);
                if (!(number === serverInfo.last_number + 1)) return [3 /*break*/, 9];
                return [4 /*yield*/, updateNumber("" + number, msg.guild.id)];
            case 3:
                _a.sent();
                return [4 /*yield*/, updateSender(msg.member.id, msg.guild.id)];
            case 4:
                _a.sent();
                return [4 /*yield*/, updateMessage(msg.id, msg.guild.id)];
            case 5:
                _a.sent();
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
                if (number === serverInfo.goal) {
                    msg.channel.send("Goal reached!");
                }
                return [3 /*break*/, 11];
            case 9:
                msg.reply("Thats not the correct number!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 10:
                _a.sent();
                _a.label = 11;
            case 11: return [3 /*break*/, 14];
            case 12:
                msg.reply("Thats not a number!").then(function (mesg) { return mesg["delete"]({ timeout: 10000 }); });
                return [4 /*yield*/, msg["delete"]()];
            case 13:
                _a.sent();
                _a.label = 14;
            case 14: return [3 /*break*/, 17];
            case 15: return [4 /*yield*/, handleCommand(msg)];
            case 16:
                _a.sent();
                _a.label = 17;
            case 17: return [3 /*break*/, 20];
            case 18: return [4 /*yield*/, handleCommand(msg)];
            case 19:
                _a.sent();
                _a.label = 20;
            case 20: return [2 /*return*/];
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
                if (isNumber(msg.content)) {
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

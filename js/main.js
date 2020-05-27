var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)), sURLVariables = sPageURL.split('&'),
        sParameterName;
    for (let i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? undefined : sParameterName[1]
        }
    }
};
var userName = getUrlParameter('channel');
var userId = null
var twitchChat = null;
var allusers = 0;
var timer = null;
var spinnerEnabled = false;
var winnerTicket = -1;
let users = [];
var settings = {
    announceWinner: false,
    subLucky: 1,
    subMonth: 0,
    activeTimer: 1,
    typeLoadUsers: 1,
    typeShowWinner: false,
    broadcaster: true,
    user: true,
    moder: true,
    sub: true,
    finish: false
};

checkUserIdByStreamer()

function connectToTwitchChat() {
    if (!twitchChat || twitchChat.readyState === 3) {
        $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-info" role="alert"><strong>Info!</strong> Connect to Twitch Chat...</div>').fadeIn('slow');
        twitchChat = new WebSocket('wss://irc-ws.chat.twitch.tv/:443/irc')
    }
}

connectToTwitchChat();
twitchChat.onopen = function open() {
    twitchChat.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
    twitchChat.send('PASS oauth:eew5h6tdy4cjj0qjf9zzc7rtvld3kf');
    twitchChat.send('NICK twitchgiveawaysbot');
    twitchChat.send('JOIN #' + userName);
    $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-success" role="alert"><strong>YES!</strong> Connected!</div>').fadeIn('slow').fadeOut('slow')
};
twitchChat.parseMessage = function (rawMessage) {
    return new Promise((resolve, reject) => {
        let parsedMessage = {
            message: null,
            tags: null,
            command: null,
            original: rawMessage,
            channel: null,
            subscriber: null,
            submonth: null,
            moderator: null,
            broadcaster: null,
            username: null,
            user_id: null
        };
        if (rawMessage[0] === '@') {
            let parseData = rawMessage.split(';')
            parseData.forEach((i, index) => {
                let parse = i.split('=')
                if (parse[0] === 'display-name') parsedMessage.username = parse[1]
                else if (parse[0] === 'mod') parsedMessage.moderator = parseInt(parse[1])
                else if (parse[0] === 'subscriber') parsedMessage.subscriber = parseInt(parse[1])
                else if (parse[0] === 'badges') {
                    let submonth = parse[1].split('/')
                    parsedMessage.submonth = parseInt(submonth[1])
                } else if (parse[0] === 'user-id') parsedMessage.user_id = parseInt(parse[1])
                else if (parse[0] === 'user-type') {
                    let message = parse[1].split(':')
                    let command = parse[1].split(' ')
                    parsedMessage.message = String(message[2]).substring(0, String(message[2]).length-2)
                    parsedMessage.command = command[2]
                }
            })
        } else if (rawMessage.startsWith("PING")) {
            parsedMessage.command = "PING";
            parsedMessage.message = rawMessage.split(":")[1]
        }
        return resolve(parsedMessage)
    })
};
twitchChat.onmessage = function (message) {
    if (message !== null) {
        this.parseMessage(message.data).then((parsed) => {
            if (parsed !== null) {
                if (parsed.command === "PRIVMSG") {
                    if (parsed.username === "nightbot" || parsed.username === "moobot" || parsed.username === "streamelements") return false;
                    if (settings.finish === true && users[winnerTicket].username == parsed.username) {
                        clearInterval(timer);
                        $(".winnerTimer").css('color', '#34e634');
                        $(".messageChat").append('<div id="mess">' + parsed.message + '</div>');
                        return false
                    }
                    if ((settings.broadcaster === false && parsed.broadcaster === 1) || (settings.moder === false && parsed.moderator === 1) || (settings.sub === false && parsed.subscriber === 1) || (settings.user === false && (parsed.broadcaster === 0 && parsed.moderator === 0 && parsed.subscriber === 0))) return false;
                    if (settings.typeLoadUsers === 1) addUser(parsed.username, parsed.moderator, parsed.subscriber, parsed.submonth, parsed.user_id, 1);
                    if (settings.typeLoadUsers === 2) addUser(parsed.username, parsed.moderator, parsed.subscriber, parsed.submonth, parsed.user_id, 2);
                    if ($(".inputkeyword").val().length !== 0 && parsed.message === String($(".inputkeyword").val()) && settings.typeLoadUsers === 3) addUser(parsed.username, parsed.moderator, parsed.subscriber, parsed.user_id, 3)
                } else if (parsed.command === "PING") {
                    twitchChat.send("PONG :" + parsed.message)
                }
            }
        })
    }
};
twitchChat.onerror = function (message) {
    $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-danger" role="alert"><strong>Failed to connect to chat Twitch!</strong> Please reload the page.<small><br>Possible reasons: <br>1. The problem is on the Twitch side. <br>2. Problems with your Internet / Provider. <br>3. There is no nickname twitch in the address bar.</small><br>Reconnect in 5 seconds!</div>').fadeIn('slow');
    setTimeout(function () {
        connectToTwitchChat()
    }, 5000)
};

function time() {
    return parseInt(new Date().getTime() / 1000)
}

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function addUser(username, moder, sub, submonth, user_id, type) {
    if (settings.subMonth > submonth) return;
    var search = false;
    users.forEach((i) => {
        if (i.username == username) search = true
    });
    if (!search) {
        var moderstr = (moder === 1) ? ' <i class="fas fa-wrench" data-toggle="tooltip" data-placement="bottom" title="Moder" style="color: #4052D7; cursor:pointer"></i>' : '';
        var subcribstr = (sub === 1) ? ' <i class="fas fa-star" data-toggle="tooltip" data-placement="bottom" title="Subscriber ' + submonth + ' month" style="color: #EBAB12; cursor:pointer"></i>' : '';
        if ($('#searchUsersList').val().length === 0) {
            (moder === 1 || sub === 1) ? $(".usersList").slice(0, 1).prepend('<div class="user"><i class="fas fa-user" data-toggle="tooltip" data-placement="right" title="Player" style="color: green; cursor:pointer"></i>' + moderstr + subcribstr + ' <span class="spanUserName">' + username + '</span></div>') : $(".usersList").append('<div class="user"><i class="fas fa-user" data-toggle="tooltip" data-placement="right" title="Player" style="color: green; cursor:pointer"></i>' + moderstr + subcribstr + ' <span class="spanUserName">' + username + '</span></div>')
        }
        users[allusers] = {
            username: username,
            moderator: moder,
            subscriber: sub,
            user_id: user_id,
            colorbox: '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6),
            lastmessage: time()
        };
        allusers++;
        $("#countUsers").text(allusers);
        $('[data-toggle="tooltip"]').tooltip()
    } else if (type == 2) {
        for (var i = 0; i < allusers; i++) {
            if (users[i].username == username) {
                users[i].lastmessage = time();
                break
            }
        }
    }
}

function LightenDarkenColor(col, amt) {
    var usePound = false;
    if (col[0] == "#") {
        col = col.slice(1);
        usePound = true
    }
    var num = parseInt(col, 16);
    var r = (num >> 16) + amt;
    if (r > 255) r = 255; else if (r < 0) r = 0;
    var b = ((num >> 8) & 0x00FF) + amt;
    if (b > 255) b = 255; else if (b < 0) b = 0;
    var g = (num & 0x0000FF) + amt;
    if (g > 255) g = 255; else if (g < 0) g = 0;
    return (usePound ? "#" : "") + (g | (b << 8) | (r << 16)).toString(16)
}

function sound(id) {
    var audio = new Audio();
    switch (id) {
        case 0: {
            audio.src = '../audio/open.wav';
            break
        }
        case 1: {
            audio.src = '../audio/click.mp3';
            break
        }
        case 2: {
            audio.src = '../audio/game-start.mp3';
            break
        }
    }
    audio.volume = 0.3;
    audio.autoplay = true
}

function winner() {
    if (allusers <= 1) {
        $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-danger" role="alert"><strong>Fail!</strong> There must be at least 2 participants in the draw.</div>').fadeIn('slow');
        return false
    }
    if (settings.subLucky > 1) {
        var subInUsers = false;
        for (var i = 0; i < allusers; i++) {
            if (users[i].subscriber === 1) {
                subInUsers = true;
                break
            }
        }
        if (!subInUsers) {
            $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-danger" role="alert"><strong>Fail!</strong> There are no paid subscribers in the participants. Set "Subscriber luck" to 1x.</div>').fadeIn('slow');
            return false
        }
    }
    if (settings.typeLoadUsers === 2) {
        var lastMesUsers = false;
        for (var i = 0; i < allusers; i++) if (users[i].lastmessage + settings.activeTimer * 60 > time()) lastMesUsers = true;
        if (!lastMesUsers) {
            $(".alertBox").fadeOut('fast').empty().append('<div class="alert alert-danger" role="alert"><strong>Fail!</strong> No one wrote in chat in exposed active time.</div>').fadeIn('slow');
            return false
        }
    }
    var luckyRandom = getRandomInt(1, settings.subLucky);
    winnerTicket = getRandomInt(0, allusers - 1);
    if (luckyRandom === 1) winnerTicket = getRandomInt(0, allusers - 1); else while (users[winnerTicket].subscriber === 0) winnerTicket = getRandomInt(0, allusers - 1);
    if (settings.typeLoadUsers === 2) while (users[winnerTicket].lastmessage + settings.activeTimer * 60 < time()) winnerTicket = getRandomInt(0, allusers - 1);
    if (settings.typeShowWinner) {
        $('.winnerBoxModal').hide();
        $('#namelot').empty();
        $('#winnertext').empty();
        $('#rounds').empty();
        $('.roulette_items').empty();
        $('.roulette_items').css('margin-left', '0px');
        $('.btnstart').show();
        if (allusers < 53) {
            for (var i = allusers - 1; i < 53; i++) {
                var rand = getRandomInt(0, allusers - 1);
                users[i] = {
                    username: users[rand].username,
                    user_id: users[rand].user_id,
                    colorbox: users[rand].colorbox
                }
            }
        }
        var count = true;
        for (var i = 0; i < 53; i++) {
            var rand = getRandomInt(0, allusers - 1);
            var NewColor = LightenDarkenColor(users[rand].colorbox, -15);
            var backgroundblock = null
            if (count) {
                backgroundblock = 'linear-gradient(45deg, ' + users[rand].colorbox + ' 0%, ' + users[rand].colorbox + ' 20%, ' + NewColor + ' 21%, ' + NewColor + ' 35%, ' + users[rand].colorbox + ' 36%, ' + users[rand].colorbox + ' 52%, ' + NewColor + ' 53%, ' + NewColor + ' 67%, ' + users[rand].colorbox + ' 68%, ' + users[rand].colorbox + ' 84%, ' + NewColor + ' 85%, ' + NewColor + ' 100%)';
                count = false
            } else {
                backgroundblock = 'linear-gradient(135deg, ' + NewColor + ' 0%, ' + NewColor + ' 15%, ' + users[rand].colorbox + ' 16%, ' + users[rand].colorbox + ' 32%, ' + NewColor + ' 33%, ' + NewColor + ' 47%, ' + users[rand].colorbox + ' 48%, ' + users[rand].colorbox + ' 64%, ' + NewColor + ' 65%, ' + NewColor + ' 79%, ' + users[rand].colorbox + ' 80%, ' + users[rand].colorbox + ' 100%)';
                count = true
            }
            const block = '<div class="item" style="background: ' + backgroundblock + '">\n' + '                        <div class="text">\n' + '                            <span class="username">' + users[rand].username + '</span>\n' + '                        </div>\n' + '                    </div>';
            $('.roulette_items').append(block)
        }
        var NewColor = LightenDarkenColor(users[winnerTicket].colorbox, -15);
        $(".item").slice(47, 48).css('background', 'linear-gradient(135deg, ' + NewColor + ' 0%, ' + NewColor + ' 15%, ' + users[winnerTicket].colorbox + ' 16%, ' + users[winnerTicket].colorbox + ' 32%, ' + NewColor + ' 33%, ' + NewColor + ' 47%, ' + users[winnerTicket].colorbox + ' 48%, ' + users[winnerTicket].colorbox + ' 64%, ' + NewColor + ' 65%, ' + NewColor + ' 79%, ' + users[winnerTicket].colorbox + ' 80%, ' + users[winnerTicket].colorbox + ' 100%)');
        $(".username").slice(47, 48).text(users[winnerTicket].username);
        $(".load").fadeOut("fast");
        $('#spinModal').modal('show');
        return false
    } else {
        clearInterval(timer);
        settings.finish = true;
        viewWinnerBox()
    }
};

function checkUserIdByStreamer() {
    $.ajax({
        url: 'https://api.twitch.tv/kraken/users?login=' + userName,
        dataType: 'json',
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': 'lzz08uzuipquyu6lmzoomeb4uiedz5'
        },
        success: function (data) {
            userId = parseInt(data.users[0]._id)
        },
        error: function (request, status, error) {
            $(".alertBox").fadeOut('fast').empty().append('' +
                '<div class="alert alert-danger" role="alert">' +
                '<strong>Failed to determine your Twitch ID.</strong>' +
                '<br>Reload this Page!' +
                '</div>')
                .fadeIn('slow');
        }
    })
}

function loadLogo() {
    $(".winner").fadeOut('fast');
    $(".load").fadeIn("fast");
    $(".winnerTimer").css('color', 'gray');
    $(".messageChat").empty();
    $(".winnerTimer").empty();
    $.ajax({
        url: 'https://api.twitch.tv/kraken/users?login=' + users[winnerTicket].username,
        dataType: 'json',
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': 'lzz08uzuipquyu6lmzoomeb4uiedz5'
        },
        success: function (data) {
            $("#winnerImg").attr('src', data.users[0].logo);
            checkFollow()
        },
        error: function (request, status, error) {
            loadLogo()
        }
    })
}

function checkFollow() {
    $.ajax({
        url: 'https://api.twitch.tv/kraken/users/' + users[winnerTicket].user_id + '/follows/channels/' + userId,
        dataType: 'json',
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': 'lzz08uzuipquyu6lmzoomeb4uiedz5'
        },
        success: function (data) {
            if (data.channel.name == userName) viewWinner(true); else viewWinner(false)
        },
        error: function (request, status, error) {
            if (request.responseJSON.error === "Not Found") viewWinner(false); else checkFollow()
        }
    })
}

function viewWinner(follow) {
    $(".load").fadeOut("fast");
    $(".winnerName").text(users[winnerTicket].username);
    (follow) ? $("#followLabel").empty().append('<i class="fas fa-check" data-toggle="tooltip" data-placement="top" title="Followed" style="color: #1DD71D; cursor: pointer;"></i>') : $("#followLabel").empty().append('<i class="fas fa-times" data-toggle="tooltip" data-placement="top" title="Don`t Followed" style="color: gray; cursor: pointer;"></i>');
    (users[winnerTicket].subscriber === 1) ? $("#subLabel").empty().append('<i class="fas fa-check" data-toggle="tooltip" data-placement="top" title="Subscriber" style="color: #1DD71D; cursor: pointer;"></i>') : $("#subLabel").empty().append('<i class="fas fa-times" data-toggle="tooltip" data-placement="top" title="Don`t Subscriber" style="color: gray; cursor: pointer;"></i>');
    $('[data-toggle="tooltip"]').tooltip();
    $(".winner").fadeIn('400');
    $(".winnerTimer").empty().append('0:00');
    var m = 0;
    var s = 0;
    timer = setInterval(function () {
        s++;
        if (s == 59) s = 0, m++;
        var str = (s < 10) ? '0' : '';
        $(".winnerTimer").empty().append(m + ':' + str + s)
    }, 1000)
}

function viewWinnerBox() {
    $("#winnerSpan").text(users[winnerTicket].username);
    $("#winnerBox").css('background', '#3E444A').css('border-color', '#3E444A');
    $('#rollButMenu, #logsButMenu').css('background', '#6c757d').css('border-color', '#6c757d');
    $(".navigator, .typeGiveaways, .keyword, .settingMenu, .alertBox").fadeOut('400');
    if (settings.announceWinner) twitchChat.send("PRIVMSG #" + userName + " :The winner is @" + users[winnerTicket].username + " !");
    loadLogo()
}

function clearUsers() {
    users.length = 0;
    allusers = 0;
    $("#countUsers").text('0');
    $("#winnerSpan").text('-');
    $(".usersList").empty();
    settings.finish = false
};
$('.btnstart').click(function (event) {
    sound(0);
    clearInterval(timer);
    spinnerEnabled = true;
    settings.finish = true;
    var enableInterval = null;
    var margin = (-$(".item").width() * 47) - (5 * 47) - getRandomInt(0, $(".item").width());
    margin = margin + 'px';
    $('.btnstart').hide();
    $('.roulette_items').animate({marginLeft: margin}, {
        duration: 13000, easing: "easeInOutQuart", start: () => {
            var MarginSpin = 0, index = 0;
            enableInterval = setInterval(function () {
                MarginSpin = $(".roulette_items").css('margin-left').slice(0, $(".roulette_items").css('margin-left').length - 2);
                while (index - MarginSpin >= $(".item").width()) {
                    index -= $(".item").width() + 5;
                    sound(1)
                }
            }, 10)
        }, complete: () => {
            clearInterval(enableInterval);
            sound(2);
            spinnerEnabled = false;
            $('.item').slice(47, 48).css('border', '4px dashed #75C71E');
            $('.winnerBoxModal').show();
            $('#namelot').text('The winner is determined!');
            $('#winnertext').append(users[winnerTicket].username);
            $("#rounds").append('The window will close in 5 seconds');
            setTimeout(function () {
                if (spinnerEnabled == false) $("#spinModal").modal('hide')
            }, 5000);
            viewWinnerBox()
        }
    })
});
$('.inputkeyword').on('input', function () {
    clearUsers()
});
$("#clearList").click(function () {
    clearUsers()
});
$("#deleteKeyword").click(function () {
    $(".inputkeyword").val("")
});
$("#announceWinner,#announceWinnerLabel").click(function () {
    settings.announceWinner = !settings.announceWinner;
    (settings.announceWinner) ? $("#announceWinner").empty().append($.parseHTML('<i class="fas fa-check"></i>')).css('color', '#1DD71D') : $("#announceWinner").empty().append($.parseHTML('<i class="fas fa-times"></i>')).css('color', 'gray')
});
$("#userBroadcaster").click(function () {
    settings.broadcaster = !settings.broadcaster;
    (settings.broadcaster) ? $(this).empty().append($.parseHTML('<i class="fas fa-check"> <span id="userTypeLabel">Broadcaster</span></i>')).css('background', '#B5E9B5').css('color', '#00993A') : $(this).empty().append($.parseHTML('<i class="fas fa-times"> <span id="userTypeLabel">Broadcaster</span></i>')).css('background', '#7F7F7F').css('color', 'white')
});
$("#userUser").click(function () {
    settings.user = !settings.user;
    (settings.user) ? $(this).empty().append($.parseHTML('<i class="fas fa-check"> <span id="userTypeLabel">User</span></i>')).css('background', '#B5E9B5').css('color', '#00993A') : $(this).empty().append($.parseHTML('<i class="fas fa-times"> <span id="userTypeLabel">User</span></i>')).css('background', '#7F7F7F').css('color', 'white')
});
$("#userMod").click(function () {
    settings.moder = !settings.moder;
    (settings.moder) ? $(this).empty().append($.parseHTML('<i class="fas fa-check"> <span id="userTypeLabel">Mod</span></i>')).css('background', '#B5E9B5').css('color', '#00993A') : $(this).empty().append($.parseHTML('<i class="fas fa-times"> <span id="userTypeLabel">Mod</span></i>')).css('background', '#7F7F7F').css('color', 'white')
});
$("#userSub").click(function () {
    settings.sub = !settings.sub;
    (settings.sub) ? $(this).empty().append($.parseHTML('<i class="fas fa-check"> <span id="userTypeLabel">Sub</span></i>')).css('background', '#B5E9B5').css('color', '#00993A') : $(this).empty().append($.parseHTML('<i class="fas fa-times"> <span id="userTypeLabel">Sub</span></i>')).css('background', '#7F7F7F').css('color', 'white')
});
$("#loadAllUsers").click(function () {
    $(this).css('background', '#128192').css('border-color', '#128192');
    $('#loadActiveUsers').css('background', '#17a2b8').css('border-color', '#17a2b8');
    $('#loadKeyword').css('background', '#17a2b8').css('border-color', '#17a2b8');
    if ($(".active").is(':visible')) {
        $(".active").fadeOut('400')
    }
    if ($(".keyword").is(':visible')) {
        $(".keyword").fadeOut('400')
    }
    $(".alertBox").fadeOut('400');
    settings.typeLoadUsers = 1;
    clearUsers()
});
$("#loadActiveUsers").click(function () {
    $(this).css('background', '#128192').css('border-color', '#128192');
    $('#loadAllUsers').css('background', '#17a2b8').css('border-color', '#17a2b8');
    $('#loadKeyword').css('background', '#17a2b8').css('border-color', '#17a2b8');
    if ($(".keyword").is(':visible')) {
        $(".keyword").fadeOut('400')
    }
    $(".active").fadeIn('400');
    $(".alertBox").fadeOut('400');
    settings.typeLoadUsers = 2;
    clearUsers()
});
$("#loadKeyword").click(function () {
    $(this).css('background', '#128192').css('border-color', '#128192');
    $('#loadAllUsers').css('background', '#17a2b8').css('border-color', '#17a2b8');
    $('#loadActiveUsers').css('background', '#17a2b8').css('border-color', '#17a2b8');
    if ($(".active").is(':visible')) {
        $(".active").fadeOut('400')
    }
    $(".keyword").fadeIn('400');
    $(".alertBox").fadeOut('400');
    settings.typeLoadUsers = 3;
    clearUsers()
});
$("#rollButMenu").click(function () {
    $(this).css('background', '#3E444A').css('border-color', '#3E444A');
    $('#logsButMenu').css('background', '#6c757d').css('border-color', '#6c757d');
    $("#winnerBox").css('background', '#6c757d').css('border-color', '#6c757d');
    $(".winner, .logs").fadeOut('400');
    $(".navigator, .typeGiveaways, .keyword, .settingMenu").fadeIn('400')
});
$("#logsButMenu").click(function () {
    $(this).css('background', '#3E444A').css('border-color', '#3E444A');
    $('#rollButMenu').css('background', '#6c757d').css('border-color', '#6c757d');
    $("#winnerBox").css('background', '#6c757d').css('border-color', '#6c757d');
    $(".navigator, .typeGiveaways, .keyword, .settingMenu, .winner").fadeOut('400');
    $(".logs").fadeIn('400')
});
$("#winnerBox").click(function () {
    if ($("#winnerSpan").text() == '-') return;
    $("#winnerBox").css('background', '#3E444A').css('border-color', '#3E444A');
    $('#rollButMenu, #logsButMenu').css('background', '#6c757d').css('border-color', '#6c757d');
    $(".navigator, .typeGiveaways, .keyword, .settingMenu, .logs").fadeOut('400');
    $(".winner").fadeIn('400')
});
$('#subLucky').on('input', function () {
    settings.subLucky = ($(this).val() / 10) + 1;
    if (settings.subLucky.toFixed(0) >= 10) {
        settings.subLucky = 10;
        $(this).css('margin-right', '23px')
    } else {
        settings.subLucky = settings.subLucky.toFixed(0);
        $(this).css('margin-right', '33px')
    }
    $("#xSubLucky").text(settings.subLucky + 'x')
});
$('#SubMonth').on('input', function () {
    settings.subMonth = ($(this).val() / 10);
    settings.subMonth = settings.subMonth.toFixed(0);
    if (settings.subMonth == 10) {
        var str = '+';
        $(this).css('margin-right', '8px')
    } else {
        var str = '';
        $(this).css('margin-right', '27px')
    }
    $("#xSubMonth").text(settings.subMonth + 'm' + str)
});
$('#activeTimer').on('input', function () {
    settings.activeTimer = $(this).val();
    settings.activeTimer++;
    if (settings.activeTimer >= 10 && settings.activeTimer < 100) $(this).css('margin-right', '18px'); else if (settings.activeTimer >= 100) {
        settings.activeTimer = 100;
        $(this).css('margin-right', '9px')
    } else {
        $(this).css('margin-right', '27px')
    }
    $("#xActiveTimer").text(settings.activeTimer + 'm')
});
$('input[id="choiceOfShowWinner"]').click(function () {
    settings.typeShowWinner = !settings.typeShowWinner
});
$('#searchUsersList').on('input', function () {
    if ($('#searchUsersList').val().length == 0) {
        $(".usersList").empty();
        for (var i = 0; i < allusers; i++) {
            var moderstr = (users[i].moderator == 1) ? ' <i class="fas fa-wrench" data-toggle="tooltip" data-placement="right" title="Moder" style="color: #4052D7; cursor:pointer"></i>' : '';
            var subcribstr = (users[i].subscriber == 1) ? ' <i class="fas fa-star" data-toggle="tooltip" data-placement="right" title="Subscriber" style="color: #EBAB12; cursor:pointer"></i>' : '';
            (users[i].moderator == 1 || users[i].subscriber == 1) ? $(".usersList").slice(0, 1).prepend('<div class="user"><i class="fas fa-user" data-toggle="tooltip" data-placement="right" title="Player" style="color: green; cursor:pointer"></i>' + moderstr + subcribstr + ' <span class="spanUserName">' + users[i].username + '</span></div>') : $(".usersList").append('<div class="user"><i class="fas fa-user" data-toggle="tooltip" data-placement="right" title="Player" style="color: green; cursor:pointer"></i>' + moderstr + subcribstr + ' <span class="spanUserName">' + users[i].username + '</span></div>')
        }
        return false
    }
    for (var i = 0; i < allusers; i++) {
        if ($(".spanUserName").slice(i, i + 1).text().indexOf($('#searchUsersList').val())) {
            $(".user").slice(i, i + 1).detach()
        }
    }
});
$('#searchUsersList').on('keyup keypress', function(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {
        e.preventDefault();
        return false;
    }
});
$("#rerollBtn").click(function () {
    winner()
});
$("#rollBtn").click(function () {
    winner()
});
$(document).on('click', '#spoilerUpdate', function (e) {
    var id = $(this).attr('value');
    if ($(".logsVersion-" + id).text().length > 0) {
        $(".logsVersion-" + id).empty();
        $("#collapseUpdate-" + id).collapse('hide');
        return false
    }
    $.ajax({
        url: '../version.json', dataType: 'json', success: function (data) {
            for (var i = 0; i < data.version.length; i++) {
                if (data.version[i].id == id) {
                    $(".logsVersion-" + id).empty().append('<div class="collapse" id="collapseUpdate-' + id + '"><div class="card card-block"><span id="changeText">Changed</span><br><span id="updateText">' + data.version[i].text + '</span></div></div>');
                    $("#collapseUpdate-" + id).collapse('show');
                    break
                }
            }
        }
    })
});
$('[data-toggle="tooltip"]').tooltip();
$(".chat").append('<iframe src="https://www.twitch.tv/embed/' + userName + '/chat" frameborder="0" scrolling="no" height="500" width="500" id="iFrameChat"></iframe>');
$(document).ready(function () {
    $("#iFrameChat").outerHeight($(window).outerHeight() - 20)
});
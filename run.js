/**
 * Created by Derek Rada on 11/17/2014.
 */

var https = require('https');
var http = require('http');
var STARTING = '1';
var DEPLOYED = '2';
var FAILED = '3';

var currentTimestamp = new Date().getTime();
// start listening to slack api
setInterval(listenToSlack, 10000); // 10 second intervals
//notifyButton('4');
// listenToSlack();

// Call slack api get the last 10 messages from channel #releases
function listenToSlack() {

    var url = "https://gannettdigital.slack.com/api/channels.history?token=xoxs-2160115660-2588000371-2588000405-589497a63b&channel=C02LTS6AV&count=10";

    var req = https.request(url, handleSlackResponse);

    // end request (send no data)
    req.end();

    // listen for error
    req.on('error', function (e) {
        console.error(e);
    });
}

// hanlde the https response from slack
function handleSlackResponse(res) {

    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (d) {
        data = data + d.toString();
    });
    res.on('end', function () {
        var slackMessage = JSON.parse(data);
        console.log(data);
        if (slackMessage.ok && slackMessage.messages && slackMessage.messages.length > 0) {
            parseSlackMessages(slackMessage.messages);
        } else {
            console.log("Missing messages");
            console.log(data);
        }
    });
}

function parseSlackMessages(messages) {

    var newMessages = messages.filter(isNewMessage).filter(botsOnly);
    currentTimestamp = (new Date()).getTime();
    console.log(newMessages);
    for (var i = newMessages.length - 1; i >= 0; i--)
    {
        if (newMessages[i].text.indexOf("Automated Release to Prod started for") >= 0)
        {
            notifyButton(STARTING);

        } else if (newMessages[i].text.indexOf("Automated Release to Prod succeeded") >= 0) {

            notifyButton(DEPLOYED);

        } else if (newMessages[i].text.indexOf("Automated Release to Prod failed") >= 0) {

            notifyButton(FAILED);
        } else {
            console.log("Message not important: " + newMessages[i].text);
        }
    }
}

// determine if the message is newer than the last time we checked
function isNewMessage(element) {

    try {
        return (parseFloat(element.ts) > (currentTimestamp / 1000));
    } catch (e) {
        return false;
        console.error(e);
    }
}

// determine if the message is from a bot
function botsOnly(element) {
    return (element.bot_id != null);
}


//
function notifyButton(arg) {

    // https://api.spark.io/v1/devices/53ff6f066667574825482367/ezbutton
    var options = {

        hostname: "api.spark.io",
        port: 443,
        path: "/v1/devices/53ff6f066667574825482367/ezbutton",
        method: "POST",
        headers: {
            "Authorization": "Bearer 1c4524d0571ec33e5729f1fba45b30d28de2f758",
            "Content-Type": "application/x-www-form-urlencoded"
        }
    };

    try {

        var req = https.request(options, notifyResponse);
        console.log("params=" + arg);
        req.write("params=" + arg);
        req.end();
    } catch (e) {
        console.error(e);
    }
}

function notifyResponse(res) {

    var data = '';
    res.setEncoding('utf8');
    res.on('data', function (d) {
        data = data + d.toString();
    });
    res.on('end', function () {
        console.log(data);
    });
}


var srv = http.createServer(httpHandler);

srv.listen(9000, '127.0.0.1', function () {
   console.log("Server is listening on port 9000");
});


function httpHandler(req, res) {

    if (req.url.indexOf('/play') >= 0) {
        playHandler(req, res);
    } else {

        defaultHandler(req,res);
    }
};


function defaultHandler(req, res) {

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<html><a href="/play/1">Sound 1</a><br><a href="/play/2">Sound 2</a><br><a href="/play/3">Sound 3</a></html>');

}

function playHandler(req, res) {

    var args = req.url.split('/');
    var arg = args[args.length - 1];

    console.log(arg);

    notifyButton(arg);

    res.writeHead(302, {"Location": "/"});
    res.end();

}

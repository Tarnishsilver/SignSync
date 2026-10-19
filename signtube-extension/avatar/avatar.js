var isReady = false;
var animQueue = [];
var isPlaying = false;
var currentWord = "";
var BASE_URL = "";
var EXT_ROOT = "";

// Speed settings
var SIGN_DURATION = 700;
var LETTER_DURATION = 400;
var MAX_QUEUE_SIZE = 30;

function initAvatar() {
    var loc = window.location.href;
    // BASE_URL is the avatar directory (e.g. chrome-extension://ID/avatar)
    BASE_URL = loc.substring(0, loc.lastIndexOf('/'));
    // EXT_ROOT is the extension root (parent of avatar/)
    EXT_ROOT = BASE_URL.substring(0, BASE_URL.lastIndexOf('/'));
    CWASA.init();
    isReady = true;
    window.parent.postMessage({ type: "avatar-ready" }, "*");
}

function playSiGMLFile(sigmlPath) {
    if (!isReady) return;
    // SiGML paths are relative to extension root (e.g. "sigml/hello.sigml")
    var fullURL = EXT_ROOT + "/" + sigmlPath;
    try {
        CWASA.playSiGMLURL(fullURL);
    } catch(e) {
        console.error("CWASA play error:", e);
    }
}

function processQueue() {
    if (animQueue.length === 0) {
        isPlaying = false;
        currentWord = "";
        window.parent.postMessage({ type: "avatar-idle" }, "*");
        return;
    }

    if (animQueue.length > MAX_QUEUE_SIZE) {
        var skipCount = animQueue.length - 10;
        animQueue.splice(0, skipCount);
        window.parent.postMessage({
            type: "avatar-skipped",
            count: skipCount
        }, "*");
    }

    isPlaying = true;
    var item = animQueue.shift();
    currentWord = item.word;

    window.parent.postMessage({
        type: "avatar-playing",
        word: item.word
    }, "*");

    playSiGMLFile(item.path);

    var duration = item.duration || SIGN_DURATION;
    setTimeout(function() {
        window.parent.postMessage({
            type: "avatar-word-done",
            word: item.word
        }, "*");
        processQueue();
    }, duration);
}

function queueAnimation(path, word, duration) {
    var dur = duration || (word.length === 1 ? LETTER_DURATION : SIGN_DURATION);
    animQueue.push({ path: path, word: word, duration: dur });
    if (!isPlaying) {
        processQueue();
    }
}

function clearQueue() {
    animQueue = [];
    isPlaying = false;
    currentWord = "";
}

function pauseQueue() {
    isPlaying = false;
}

function resumeQueue() {
    if (animQueue.length > 0 && !isPlaying) {
        processQueue();
    }
}

function setSpeed(signDur, letterDur) {
    if (signDur) SIGN_DURATION = signDur;
    if (letterDur) LETTER_DURATION = letterDur;
}

window.addEventListener("message", function(event) {
    var data = event.data;
    if (!data || !data.type) return;

    switch(data.type) {
        case "play-sigml":
            queueAnimation(data.path, data.word, data.duration);
            break;
        case "play-batch":
            if (data.items && Array.isArray(data.items)) {
                data.items.forEach(function(item) {
                    queueAnimation(item.path, item.word, item.duration);
                });
            }
            break;
        case "clear":
            clearQueue();
            break;
        case "pause":
            pauseQueue();
            break;
        case "resume":
            resumeQueue();
            break;
        case "set-speed":
            setSpeed(data.signDuration, data.letterDuration);
            break;
        case "ping":
            window.parent.postMessage({ type: "pong", ready: isReady }, "*");
            break;
    }
});

// Replace inline onload handler
window.addEventListener('load', function() {
    initAvatar();
});

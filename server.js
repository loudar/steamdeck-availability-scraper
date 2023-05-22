const url = "https://store.steampowered.com/steamdeck";

console.log("Starting... (this can take a little while)");
const { JSDOM } = require("jsdom");
const jsdom = new JSDOM('', { runScripts: "dangerously", resources: "usable", url });
const { window } = jsdom;
const { document } = window;

require('dotenv').config();
window.navigator.language = process.env.LANG || "en-US";

const callbackUrl = process.env.CALLBACK_URL || undefined;
if (!callbackUrl) {
    console.warn("CALLBACK_URL is not defined! Please define it in .env file.");
}

fetch(url).then(async res => {
    if (!res.ok) {
        throw new Error(`fetching site failed! status: ${res.status}`);
    } else {
        console.log("Fetching site succeeded.");
        console.log("Parsing text...");
        return res.text();
}}).then(async text => {
    console.log("Setting up virtual site...");
    const $ = require("jquery")(window);
    $(document).ready(() => {
        const oldConsoleLogs = disableLogs();
        $("body").html(text);
        enableLogs(oldConsoleLogs);
        console.log("Site created!");
        setTimeout(() => {
            getAvailableVersions($).then(() => {
                process.exit(0);
            });
        }, 10000);
    });
});

function enableLogs(oldConsoleLogs) {
    console.log = oldConsoleLogs.log;
    console.warn = oldConsoleLogs.warn;
    console.error = oldConsoleLogs.error;
    console.debug = oldConsoleLogs.debug;
}

function disableLogs() {
    const oldConsoleLogs = {
        log: console.log,
        warn: console.warn,
        error: console.error,
        debug: console.debug
    };
    console.log = function() {};
    console.warn = function() {};
    console.error = function() {};
    console.debug = function() {};
    return oldConsoleLogs;
}

async function getAvailableVersions($) {
    const reservationCtn = $(".reservation_ctn");
    console.log("Found " + reservationCtn.length + " versions.");
    const versions = [];
    for (let rsvCtn of reservationCtn) {
        const price = $(rsvCtn).find(".bbcode_price").find("div").text();
        const available = $(rsvCtn).find(".ReservationAddToCart").length > 0;
        versions.push({
            price: price,
            available: available
        });
    }
    console.log("Versions: ", versions);
    if (versions.find(v => v.available)) {
        if (!callbackUrl || callbackUrl.length === 0) {
            console.warn("CALLBACK_URL is not defined! Skipping callback.");
            return;
        }
        const res = await fetch(callbackUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(getCustomizedRequestBody(callbackUrl, versions))
        })
        if (res.ok) {
            console.log("Callback succeeded!");
        } else {
            console.error("Callback failed! status: " + res.status);
            console.log("Response: ", await res.text());
        }
    }
}

function getCustomizedRequestBody(callbackUrl, data) {
    const baseDomain = callbackUrl.split("/").slice(0, 3).join("/");
    switch (baseDomain) {
        case "https://discord.com":
            return {
                content: "Steam Deck is available!",
                embeds: [{
                    title: "Steam Deck is available!",
                    description: "Steam Deck is available! Go to [Steam Deck page](" + url + ") to buy it!",
                    fields: [{
                        name: "Versions",
                        value: data.map(v => v.price).join("\n")
                    }],
                    color: 0x00ff00
                }],
                username: "Steam Deck Notifier"
            }
        default:
            return data;
    }
}
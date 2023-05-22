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
        $("body").html(text);
        console.log("Site created!");
        setTimeout(() => {
            getAvailableVersions($);
            process.exit(0);
        }, 10000);
    });
});

function getAvailableVersions($) {
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
        if (!callbackUrl) {
            console.warn("CALLBACK_URL is not defined! Skipping callback.");
            return;
        }
        fetch(callbackUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(versions)
        }).then(r => {
            if (r.ok) {
                console.log("Callback succeeded!");
            } else {
                console.error("Callback failed! status: " + r.status);
            }
        });
    }
}
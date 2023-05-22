const url = "https://store.steampowered.com/steamdeck";
fetch(url).then(async res => {
    if (!res.ok) {
        console.log("fetching site failed, code: " + res.status);
    } else {
        console.log("fetching site succeeded!");
        console.log("Creating jsdom...");
        const { JSDOM } = require("jsdom");
        const jsdom = new JSDOM('', { runScripts: "dangerously", resources: "usable", url: "https://store.steampowered.com/steamdeck" });
        const { window } = jsdom;
        const { document } = window;
        
        console.log("Parsing text...");
        const text = await res.text();

        console.log("Creating jquery...");
        const $ = require("jquery")(window);
        console.log("Inserting text into window...");
        $(document).ready(() => {
            setTimeout(() => {
                $("body").html(text);
                console.log("body created!");
                setTimeout(() => {
                    const nodes = $(".ReservationAddToCart button");
                    console.log("Found " + nodes.length + " nodes.");
                    if (nodes.length > 0) {
                        for (let i = 0; i < nodes.length; i++) {
                            const node = nodes[i];
                            console.log(`version:${i}/${nodes.length}:${node.innerHTML}`);
                        }
                    }
                }, 10000);
            }, 100);
        });
    }
});
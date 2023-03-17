import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { heroList, API } from './config/api.js';
import { CONFIG } from './config/index.js'
import { sendNotification } from './telegram.js'
import mkdirp from 'mkdirp'

var Found = []

async function crawlImages(hero) {
    let failed = 0;
    if (!fs.existsSync('./data/art/' + hero.toString() + '/')) mkdirp('./data/art/' + hero.toString() + '/', { mode: 0o755 });
    for (let i = 0; i <= 30 && failed < 3; i++) {
        let skinId = `${hero.toString()}`
        if (i < 10) skinId = skinId.concat('0');
        skinId = skinId.concat(`${i.toString()}`)
        if (!fs.existsSync('./data/art/' + hero + '/' + skinId + '.jpg')) {
            let isFound = false
            for (const [server, api] of Object.entries(API)) {
                let apiLink = api.replace("##ID##", skinId)
                try {
                    const response = await fetch(apiLink, { timeout: 5000 });
                    if (response.ok) {
                        const imagePath = path.join(`./data/art/${hero.toString()}/`, `${skinId}.jpg`);
                        const fileStream = fs.createWriteStream(imagePath);
                        response.body.pipe(fileStream);
                        console.log(`Found new art ${skinId} at server ${server}`);
                        Found.push({ id: skinId, apiLink: apiLink })
                        isFound = true
                        break
                    } else {
                        console.log(`Not found ${skinId} at server ${server}`);
                    }
                } catch (error) {
                    //  console.error(error);
                }
                if (isFound) break;
            }
            if (!isFound) failed++;
        }
    }
}

if (!fs.existsSync('./data/art/')) {
    mkdirp('./data/art', { mode: 0o755 }, (error) => {
        if (error) console.log('Failed to make directory data...Error : ' + error);
    });
}

const Scan = () => {
    return Promise.all(heroList.map(crawlImages));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const start = async () => {
    return new Promise(async (resolve, reject) => {
        console.time('time');
        Found = []
        let found = await Scan();
        console.log(`Found ${Found.length} new art.`);
        if (Found.length > 0) {
            Found.forEach(async (skin) => {
                await sendNotification(`[Bot Crawl 3.0] Đã tìm thấy art (${skin.id}) mới !`, skin.apiLink)
            });
        }
        console.timeEnd('time');
        console.log("Scan again after 5mins...")
        resolve();
    })
}

while (1) {
    await start()
    await sleep(1000*60*5); //!Sleep 5mins
}
//crawlImages('https://www.example.com', 1, 3);

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// load filteredNames.json
let filteredNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'filteredNames-2.json')));

let state = {
    currentNumber: 0,
};
// task: Make a app to auto register random domains
// data location: ./data.json


/* convert numbers to wordString
example:
0 = "a"
1 = "b"
2 = "c"
3 = "d"
4 = "e"
5 = "f"
...
10 = "i"
11 = "j"
12 = "k"
13 = "l"
...
25 = "z"
26 = "aa"
27 = "ab"
*/
function convertToWordString(number) {
    let wordString = "";
    let remainder = 0;
    while (number > 0) {
        remainder = number % 26;
        number = Math.floor(number / 26);
        if (remainder == 0) {
            remainder = 26;
            number--;
        }
        wordString = String.fromCharCode(64 + remainder) + wordString;
    }
    return wordString;
}

// convert back
function convertToNumber(wordString) {
    let number = 0;
    for (let i = 0; i < wordString.length; i++) {
        number = number * 26 + wordString.charCodeAt(i) - 64;
    }
    return number;
}

// get next domain name
function getNextDomainName() {
    let name = filteredNames[state.currentNumber];
    state.currentNumber++;
    saveState();
    return name;
}

// generate random 4 charactor string
function getRandomString() {
    let result = "";
    // let characters = "abcdefghijklmnopqrstuvwxyz0123456789-";
    let characters = "abcdefghijklmnopqrstuvwxyz";
    let charactersLength = characters.length;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
    

// save state to json file 
function saveState() {
    fs.writeFileSync(path.join(__dirname, 'data.json'), JSON.stringify(state));
}

// load state from json file
function loadState() {
    if (fs.existsSync(path.join(__dirname, 'data.json'))) {
        state = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json')));
    }
}

// get next domain name Char
function getNextDomainNameFromChar() {
    let domainName = convertToWordString(state.currentNumber);
    state.currentNumber++;
    saveState();
    return domainName;
}

// get next domain name
function getNextDomainName() {
    let name = filteredNames[state.currentNumber];
    state.currentNumber++;
    saveState();
    return name;
}


// log to log.txt
function log(message) {
    fs.appendFileSync(path.join(__dirname, 'log.txt'), message + '\n');
}

console.log(convertToNumber("zasd".toLocaleUpperCase()));


async function registerNewDomain() {
    // new puppetier browser
    const browser = await puppeteer.launch({
        headless: false,
        // 1000x1000
        args: ['--window-size=1920,1000'],
        // save session
        userDataDir: "./user_data"
    });
    // load state
    loadState();
    let currentDomain = getRandomString();

    // open namebase.io
    const page = await browser.newPage();
    await page.goto('https://www.namebase.io/domains/' + currentDomain);



    // log registering domain
    log('registering domain: ' + currentDomain);

    // wait for page load
    await page.waitForSelector('button[class*="WatchButton"]');

    // wait for page to load 
    // await page.waitForSelector('#domain-name');
    // check if element exist #root > div.Grid-sc-12uvu6z-0.DomainPage___StyledGrid-j0g52u-0.igpLQY > div.GarnishWithTimeline__ContentRoot-sc-1fu46rj-2.jVGqdh > div.GarnishWithTimeline__RightContent-sc-1fu46rj-1.XAqpz > div > div
    if ((await page.$('div[class*="GarnishWithTimeline__RightContent"] > div > div'))) {
        // get text value of the div
        const text = await page.$eval('div[class*="GarnishWithTimeline__RightContent"] > div > div', el => el.textContent);
        // check if text contains "Highest lockup"
        if (text.includes('Highest lockup')) {
            // parse float from text "Highest lockup: 0.00 HNS"
            const lockup = parseFloat(text.split(':')[1].trim().split(' ')[0]);
            // check if lockup is greater than 0.50 HNS
            if (lockup > 0.50) {
                // Log domain is too expensive
                log('Domain is too expensive.');
                // log current domain price
                log('Current domain price: ' + lockup + ' HNS');
                log(''); // for divider

                // close browser
                await browser.close();
                // return to register new domain
                return registerNewDomain();
            }


            // check if account have enough balance
            // get balance from 'div[class*="GarnishWithTimeline__RightContent"]  form  div[class*="PlaceBidPanelStyledComponents__Balance"]'
            const balance = await page.$eval('div[class*="GarnishWithTimeline__RightContent"]  form  div[class*="PlaceBidPanelStyledComponents__Balance"]', el => el.textContent);
            // parse float from text "Available balance: 113.64 HNS"

            const balanceValue = parseFloat(balance.split(':')[1].trim().split(' ')[0]);
            // log balance
            log('Current balance: ' + balanceValue + ' HNS');
            // check if balance is greater than lookup
            if (balanceValue < lockup) {
                // Log not enough balance
                log('Not enough balance.');
                log(''); // for divider

                // close browser
                await browser.close();
                // return to register new domain
                return registerNewDomain();
            }

            // if balance drops below 0.50 exit
            if (balanceValue < 0.50) {
                // Log not enough balance
                log('Not enough balance.');
                log(''); // for divider

                // close browser
                await browser.close();
                // exit
                return process.exit();
            }

            // place a bid
            // bid value input: input
            // Bliend Value: input
            // submit button: button

            let lookup = 0;
            let bliend = 0;

            if (lockup > 0.40) {
                // // input bid value
                // await page.type('input', lockup + 0.01 + "");
                // // click on bid
                // await page.click('div[class*="GarnishWithTimeline__RightContent"]  form  button');
                // // log biding success
                // log('Bid success.');
                // // log total bid
                // log('Total bid: ' + (lockup + 0.01) + ' HNS');
                lookup = lockup + 0.01;
                bliend = 0;
            } else {
                lookup = 0;
                bliend = 0.4;
            }
            await page.type('div:nth-child(2) > span >input', lookup.toString());
            // input 0.4 on 2nd input
            await page.type('div:nth-child(3) > span >input', bliend.toString());
            await page.click('div[class*="GarnishWithTimeline__RightContent"]  form  button');
            // wait for [class*="ConfirmBidModal"] button[class*="Button-sc"]
            await page.waitForSelector('[class*="ConfirmBidModal"] button[class*="Button-sc"]');
            // click on [class*="ConfirmBidModal"] button[class*="Button-sc"]
            await page.click('[class*="ConfirmBidModal"] button[class*="Button-sc"]');

            // wait 5 seconds
            await page.waitFor(5000);
            // wait for [class*="ConfirmBidModal"]  a[class*="Button-sc"]'
            await page.waitForSelector('[class*="ConfirmBidModal"]  a[class*="Button-sc"]');
            // if [class*="ConfirmBidModal"]  a[class*="Button-sc"]' contains "View Receipt"
            if ((await page.$('[class*="ConfirmBidModal"]  a[class*="Button-sc"]')) && (await page.$eval('[class*="ConfirmBidModal"]  a[class*="Button-sc"]', el => el.textContent)).includes('View Receipt')) {
                // success
                log('Bid success.');
                // log bid and lookup
                log('Total bid: ' + (lockup + bliend) + ' HNS');
                log('Lookup: ' + lookup + ' HNS');
                log('Bliend: ' + bliend + ' HNS');
            }
            log(''); // for divider
            await browser.close();
        }
    } else {
        // log to log.txt
        log('domain is not available');
        log(''); // for divider

        // close browser
        await browser.close();
        // return to register new domain
    }
}

; (async () => {
    // register new domain
    while (true) {
        await registerNewDomain();
        // wait for 10 minutes
        // await sleep(1000 * 60 * 1);
    }
})();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
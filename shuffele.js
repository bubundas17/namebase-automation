const fs = require('fs');
const path = require('path');

// load filteredNames.json
const filteredNames = JSON.parse(fs.readFileSync(path.join(__dirname, 'filteredNames.json'), 'utf8'));
// shuffle the array
let shuffledNames = filteredNames.sort(() => Math.random() - 0.5);

// filter larger than 7 charractors
shuffledNames = shuffledNames.filter(name => name.length < 6);

// save back
fs.writeFileSync(path.join(__dirname, 'filteredNames-2.json'), JSON.stringify(shuffledNames, null, 2));

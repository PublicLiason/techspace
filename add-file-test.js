const {createReadStream, createWriteStream} = require('fs')

const stream_1 = createWriteStream('./test-file.json', {encoding: 'utf8', flags: 'a',})

stream_1.on('error', error => console.log(error))
module.exports = {stream_1}

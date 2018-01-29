const fs = require('fs')
const getPixes = require('./getPixes')
const fetch = require('./fetch-v1')
const splitToChar = require('./parseImage')
const sameColor = (x, y) => {
    return distance(x, y) == 0
}
const distance = (x, y) => {
    //　欧几里得
    let r = 0
    for (var i = 0; i < x.length; i++) {
        r += Math.pow((x[i] - y[i]), 2)
    }
    return Math.sqrt(r)
}

const white = [255, 255, 255], blue = [0, 0, 255], whitesym = '-', bluesym = '0'
function binary(x) {
    if (distance(x, white) < distance(x, blue)) {
        return whitesym
    }
    return bluesym
}

async function readLableSync(labledir) {
    let dir = `sample/${labledir}`
    let features = fs.readdirSync(dir)
    var col = []
    for (var ele of features) {
        console.log('Loading images in ', labledir, 'with:', ele)
        var val = await getPixes(`${dir}/${ele}`)
        col.push({ k: labledir, v: val })
    }
    return col
}


function score(a, b) {
    let al = a.length,
        ar = a[0].length,
        bl = b.length,
        br = b[0].length
    width = al > bl ? al : bl
    height = ar > br ? ar : br
    var _sc = 0
    for (var i = 0; i < width; i++) {
        for (var j = 0; j < height; j++) {
            if (a[i] && b[i]) {
                if (a[i][j] == b[i][j] && a[i][j] == whitesym) {
                    _sc++
                }
            }
        }
    }
    return _sc
}



function loadSamples() {
    return new Promise((resolve, reject) => {
        fs.readdir('sample', async (e, files) => {
            if (e) throw e
            var samples = []
            for (var lable of files) {
                var lableVal = await readLableSync(lable)
                samples.push(lableVal)
            }

            console.log("load finshed!!")
            console.log(samples)
            resolve(samples)
        })
    })
}
async function computerBestMatch(dir, ele) {
    console.log(` computering ele best match`)
    var data = imageToArray(dir, ele)
    var sammples = await loadSamples()
    console.log(sammples)
    var sc = sammples.map((one) => {
        return { sc: score(one.v, data), tag: ele, k: one.k }
    }).reduce((a, b) => { return a.sc > b.sc ? a : b })
    console.log(sc)
}

// loadSamples()
!(async () => {
    fetch('aa', (code) => {
        console.log(code)
        splitToChar(code, (name) => {
            console.log(name, "_____________________________________")
            loadSamples()
        })
    })
})()

// (() => {
//     fetch('ab', (code) => {
//         console.log(code)
//         // computerBestMatch('codes', 'codeab.jpeg')
//     })
// })()

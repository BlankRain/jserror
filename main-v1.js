const getPixels = require("get-pixels")
const fs = require('fs')
const fetch = require('./fetch-v1')
const splitToChar = require('./seecode-v1')
const EventEmitter = require('events').EventEmitter;
var event = new EventEmitter();
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

const pixelsToArray = (pixels) => {
    let width = pixels.shape[0],
        height = pixels.shape[1]
    var result = []
    for (var i = 0; i < width; i++) {
        result[i] = []
        for (var j = 0; j < height; j++) {
            var r = pixels.get(i, j, 0)
            var g = pixels.get(i, j, 1)
            var b = pixels.get(i, j, 2)
            var p = [r, g, b]
            var s = binary(p)
            result[i][j] = s
        }
    }
    return result
}

const imgToArray = (dir, ele, cb, len) => {
    getPixels(`${dir}/${ele}`, (err, pixels) => {
        if (err) {
            console.log("Bad image path" + err)
            return
        }
        var result = pixelsToArray(pixels)

        cb(dir, ele, result, len)
    })
}
const readLable = (labledir, cb) => {
    let dir = `sample/${labledir}`
    let features = fs.readdirSync(dir)
    features.forEach(ele => imgToArray(dir, ele, cb, features.length))
}
function doAllDir(dir, cb) {
    fs.readdir(dir, (e, fa) => {
        if (e) throw e
        fa.filter(x => x.indexOf('png') > 0).forEach((ele, i, a) => {
            imgToArray(dir, ele, cb, a.length)
        })
    })
}
function registAfterLibLoaded(f) {
    var _loaded = []
    event.on('loadFinished', (cb, p, len) => {
        _loaded.push(p)
        console.log('tag ', p, ' load finished')
        if (_loaded.length == len) {
            var fun = f ? f : (dir) => { doAllDir(dir || 'result', cb) }
            fun()
        }
    })
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
    // console.log(a.length, b.length, _sc)
    return _sc
}

function loadSamples(hanlde) {
    registAfterLibLoaded(hanlde);
    var sammples = []
    fs.readdir('sample', (e, files) => {
        if (e) throw e
        files.forEach((p) => {
            console.log('loading ', p)
            var _sam = [[]]
            readLable(p, (labledir, ele, result, len) => {
                _sam.push({ k: labledir, v: result })
                sammples.push({ k: labledir, v: result })
                if (_sam.length == len) {
                    event.emit('loadFinished', (d, ele, r) => {
                        console.log(` computering ele best match`)
                        var sc = sammples.map((one) => {
                            return { sc: score(one.v, r), tag: ele, k: one.k }
                        }).reduce((a, b) => { return a.sc > b.sc ? a : b })
                        console.log(sc)
                    }, p, files.length)
                }
            })
        })
    })
}


var hanlde = () => {
    imgToArray('', ele, cb, a.length)
}
// loadSamples()
fetch('demov1', (code) => {
    console.log(code)
    splitToChar(code, (name) => {
        loadSamples()
    })
})

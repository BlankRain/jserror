const getPixels = require("get-pixels")
const fs = require('fs')
const PNGlib = require('node-pnglib')

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
// 0,0,248 blue
const sortBy = (data) => {
    var r = []
    for (var i in data) {
        r.push({ k: i, v: data[i] })
    }

    return r.sort((x, y) => {
        return - x.v + y.v
    })
}

const count = (arr) => {
    return arr.reduce((prev, item) => {
        if (item in prev) {
            prev[item]++
        } else {
            prev[item] = 1
        }
        return prev;
    }, {});
}

const white = [255, 255, 255], blue = [0, 0, 255], whitesym = '-', bluesym = '0'
function binary(x) {
    if (distance(x, white) < distance(x, blue)) {
        return whitesym
    }
    return bluesym
}

const canWalk = (me, des) => {
    let [s, e] = me.range
    let [ls, le] = des.range
    if (s > le || ls > e) {
        return false
    }
    return true
}
const forceSearch = (tokens) => {
    var i = 0;
    while (i < tokens.length) {
        var layer = tokens[i]
        var nextFloor = tokens[i + 1]
        for (var ele of layer) {
            if (nextFloor) {

                var cld = nextFloor.filter((e) => {
                    return canWalk(ele, e)
                })
                if (cld.length != 0) {
                    ele.child = cld
                }
            }
        }

        i++
    }

    // console.log(tokens)
}
const depth = (obj) => {
    if (!obj.child) {
        return 1
    }
    if (obj.child instanceof Array) {
        var childdep =
            obj.child.map((e) => {
                return depth(e)
            }).reduce((a, b) => {
                return Math.max(a, b)
            }, 0)
        return childdep + 1
    }
    return 0
}
var stack = []
const findItOut = (path, obj) => {
    //0:
    if (!obj.child) {
        // console.log(path)
        stack.push(path)
        // return path
    }
    if (obj.child instanceof Array) {
        for (var i = 0; i < obj.child.length; i++) {
            findItOut(path + ':' + i, obj.child[i])
        }
    }
    // return path
}
const print = (path, tokenObj) => {
    var col = []
    var flag = tokenObj
    for (var i of path) {
        if (i == ':') continue
        var tk = flag.child[i]
        var cleaned = tk[0]
        if (cleaned.length <= 5) {
            cleaned = cleaned.replace(/0/g, whitesym)
        }
        var o = tk.input.slice(0, tk.index) + cleaned + tk.input.slice(tk.index + tk[0].length, tk.input.length)
        col.push(o)
        // console.log(o)
        flag = tk
    }
    return col
}

const computerScore = (path, tokenObj) => {
    var col = []
    var flag = tokenObj
    for (var i of path) {
        if (i == ':') continue
        var tk = flag.child[i]
        col.push(tk[0])
        flag = tk
    }
    // computer scores
    var c = count(col)
    var score = 1
    for (var i in c) {
        if (i.length <= 4) {
            score = score * (c[i] / i.length)
        }
    }
    return { score: score, path: path }
}
const canSkip = (arr) => {
    for (var i of arr) {
        if (i == bluesym) return false
    }
    return true
}
const skipBlankLine = (dataArr) => {
    var r = []
    let width = dataArr.length, height = dataArr[0].length
    for (var i = 0; i < height; i++) {
        var skip = true
        for (var j = 0; j < width; j++) {
            if (dataArr[j][i] == bluesym) {
                skip = false
                break
            }
        }
        if (skip) {

        } else {
            var line = []
            for (var j = 0; j < width; j++) {
                line.push(dataArr[j][i])
            }
            r.push(line);
        }
    }

    return r
}
const toPng = (basename, name, dataArr) => {
    var dataArr = skipBlankLine(dataArr)
    let width = dataArr[0].length, height = dataArr.length
    let png = new PNGlib(width, height);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            var color = dataArr[j][i] == whitesym ? 'white' : 'blue'
            png.setPixel(i, j, color);
        }
    }

    fs.writeFileSync(`result/${basename}_${name}.png`, png.getBuffer());
}
const handle = (lines, basename) => {
    const tokens = lines.map((ele, i, a) => {
        let reg = new RegExp(bluesym + '+', "g")
        var x = reg.exec(ele)
        let result = []
        while (x != null) {
            x.range = [x.index, x.index + x[0].length]
            result.push(x)
            x = reg.exec(ele)
        }
        return result;
    }).filter((x) => x.length != 0)

    forceSearch(tokens)
    var roo = tokens[0][0]
    var x = findItOut('0', roo)
    var longlen = stack.reduce((a, b) => {
        return a.length > b.length ? a : b
    }, '').length
    var allpaths = stack.filter((x) => {
        return x.length == longlen
    })

    var best = stack.filter((x) => {
        return x.length == longlen
    }).map(
        (path) => {
            return computerScore(path, { child: [roo] })
        }
        ).reduce(
        (a, b) => {
            return a.score > b.score ? a : b
        }
        )

    var log = (obj) => {
        var p = print(obj.path, { child: [roo] })
        var one = ''
        var chars = [], flag = []
        var start = true
        for (var e of p) {
            if (start && e.indexOf('0') == -1) continue
            start = false
            if (e.indexOf('0') == -1) {
                start = true
                chars.push(flag.slice())
                flag = []
            } else {
                flag.push(e)
            }
        }
        // console.log(chars)
        return chars
    }
    var chars = log(best)
    chars.forEach((x, i) => {
        toPng(basename, i, x)
    })
    stack = []
}


const computer = (basename, allPixes) => {
    var line = ''
    var allline = []
    for (var i = 0; i < allPixes.length; i++) {
        var e = allPixes[i]
        e.icon = binary(e)
        if (i % allPixes.height == 0 && line != '') {
            allline.push(line)
            // console.log(line)
            line = ''
        }
        line += e.icon

    }
    handle(allline, basename)
}
function splitToChar(imgfile, cb) {
    var allPixes = []
    getPixels(imgfile, function (err, pixels) {
        if (err) {
            console.log("Bad image path" + err)
            return
        }
        let width = pixels.shape[0],
            height = pixels.shape[1]
        allPixes.width = width
        allPixes.height = height
        for (var x = 0; x < width; x++) {
            var line = ''
            for (var y = 0; y < height; y++) {
                var r = pixels.get(x, y, 0)
                var g = pixels.get(x, y, 1)
                var b = pixels.get(x, y, 2)
                var v = [r, g, b]
                v.meta = { x: x, y: y }
                allPixes.push(v)
            }
        }
        var basename = imgfile.match(/(\w+).jpeg/)[1]
        computer(basename, allPixes)
        if (cb) cb(`result/${basename}_`)
    })
}

// splitToChar('./codes/code0.jpeg')
function doAllCodes() {
    var dir = './codes'
    fs.readdir(dir, (e, x) => {
        x.forEach(y => splitToChar(`${dir}/${y}`))
    })
}
splitToChar.doAllCodes=doAllCodes
module.exports = splitToChar
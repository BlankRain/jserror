const getPixes = require("./getPixes")
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
/**
 * 统计数组中元素出现的次数
 * 返回 {ele:c1,ele2:c2}
 * @param {Array} arr 
 */
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
/**
 * 二值化, 距离谁最近,就返回谁的符号
 * @param {[number,number,number]} x 
 */
function binary(x) {
    if (distance(x, white) < distance(x, blue)) {
        return whitesym
    }
    return bluesym
}

/**
 * 是否连通?
 * @param {*} me 
 * @param {*} des 
 */
const canWalk = (me, des) => {
    let [s, e] = me.range
    let [ls, le] = des.range
    if (s > le || ls > e) {
        return false
    }
    return true
}
/**
 * 暴力建立连通图
 * @param {*} tokens 
 */
const forceSearch = (tokens) => {
    for (var i = 0; i < tokens.length; i++) {
        var layer = tokens[i] // 本层数据
        var nextFloor = tokens[i + 1] //下层数据
        for (var ele of layer) {
            if (nextFloor) {

                var cld = nextFloor.filter((e) => {
                    return canWalk(ele, e)
                }) // 下层具有连通关系的所有数据
                if (cld.length != 0) {
                    ele.child = cld
                }
            }
        }
    }
    if (isDebug()) {
        console.log(tokens)
    }
}
/**
 * 计算深度
 * @param {*} tree 
 */
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
/**
 * 递归查找路径
 * @param {*} path 
 * @param {*} obj 
 */
const findItOut = (stack, path, obj) => {
    if (!obj.child) {
        stack.push(path)
    }
    if (obj.child instanceof Array) {
        for (var i = 0; i < obj.child.length; i++) {
            findItOut(stack, path + ':' + i, obj.child[i])
        }
    }
}
/**
 * 打印某条路径到人可读情况
 * @param {*} path 
 * @param {*} tokenObj 
 */
const humanRead = (path, tokenObj) => {
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
        if (isDebug('humanRead')) {
            console.log(o)
        }
        flag = tk
    }
    return col
}

/**
 * 计算路径得分
 * 
 * @param {*} path 
 * @param {*} tokenObj 
 */
const computerScore = (path, tokenObj) => {
    var col = []
    var flag = tokenObj
    for (var i of path) {
        if (i == ':') continue
        var tk = flag.child[i]
        col.push(tk[0])
        flag = tk
    }
    var c = count(col)
    var score = 1
    for (var i in c) {
        if (i.length <= 4) {
            score = score * (c[i] / i.length)
        }
    }
    return { score: score, path: path }
}
/**
 * 是否可以跳过
 * @param {*} arr 
 */
const canSkip = (arr) => {
    for (var i of arr) {
        if (i == bluesym) return false
    }
    return true
}
/**
 * 跳过空行
 * @param {*} dataArr 
 */
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

/**
 * 生成PNG文件.
 * @param {*} basename 
 * @param {*} name 
 * @param {*} dataArr 
 */
const toPng = (basename, name, dataArr) => {
    var _dataArr = dataArr
    if (isSkipBlankLine()) {
        _dataArr = skipBlankLine(dataArr)
    }
    let width = _dataArr[0].length, height = _dataArr.length
    let png = new PNGlib(width, height);
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
            var color = _dataArr[j][i] == whitesym ? 'white' : 'blue'
            png.setPixel(i, j, color);
        }
    }
    fs.writeFileSync(`result/${basename}_${name}.png`, png.getBuffer());
}
/**
 * 字符化后的图像处理
 * @param {*} lines 
 * @param {*} basename 
 */
const stringImageProgress = (lines, basename) => {
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
    const stack = []
    var x = findItOut(stack, '0', roo)
    var longlen = stack.reduce((a, b) => {
        return a.length > b.length ? a : b
    }, '').length
    const allpaths = stack.filter((x) => {
        return x.length == longlen
    })

    const best = stack.filter((x) => {
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

    const log = (obj) => {
        var p = humanRead(obj.path, { child: [roo] })
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
        return chars
    }
    const chars = log(best)
    chars.forEach((x, i) => {
        toPng(basename, i, x)
    })
}


const startParse = (basename, allPixes) => {
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
    stringImageProgress(allline, basename)
}

async function splitToChar(imgfile, cb) {
    var basename = imgfile.match(/(\w+).jpeg/)[1]
    var allPixes = await getPixes(imgfile)
    startParse(basename, allPixes)
    if (cb) cb(`result/${basename}_`)
}
const isDebug = () => false
const isSkipBlankLine = () => false
// splitToChar('./codes/code0.jpeg')
function doAllCodes() {
    var dir = './codes'
    fs.readdir(dir, (e, x) => {
        x.forEach(y => splitToChar(`${dir}/${y}`))
    })
}
splitToChar.doAllCodes = doAllCodes
module.exports = splitToChar
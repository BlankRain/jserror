const _get = require("get-pixels")
module.exports = function (imgfile) {
    return new Promise((resolve, reject) => {
        _get(imgfile, (err, pixels) => {
            if (err) {
                return reject(err)
            }
            var data = []
            let width = pixels.shape[0],
                height = pixels.shape[1]
            data.width = width
            data.height = height
            for (var x = 0; x < width; x++) {
                var line = ''
                for (var y = 0; y < height; y++) {
                    var r = pixels.get(x, y, 0)
                    var g = pixels.get(x, y, 1)
                    var b = pixels.get(x, y, 2)
                    var v = [r, g, b]
                    v.meta = { x: x, y: y }
                    data.push(v)
                }
            }
            resolve(data)
        })
    })
}

const https = require('https')
const fs = require('fs')
const Rx = require('rxjs')
const logAndSave = (str, name) => {
    console.log(str)
    const result = JSON.parse(str)
    if (result.status) {
        const base64Data = result.data.replace(/^data:image\/\w+;base64,/, "");
        var dataBuffer = new Buffer(base64Data, 'base64');
        fs.writeFile(`codes/code${name}.jpeg`, dataBuffer, function (err) {
            if (err) {
                throw err
            } else {
                console.log('save success')
            }
        });
    }
}
const PhoneNumber = () => {
    var r = '18'
    for (var i = 0; i < 9; i++) {
        r += Math.floor(Math.random() * 10)
    }
    return r
}
const fetchAndSave = (name, cb) => {
    var options = {
        hostname: 'es.xiaojukeji.com',
        protocol: 'https:',
        port: 443,
        path: '/Auth/getVerifyCode?phone=' + PhoneNumber(),
        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cache-Control': 'max-age=0',
            'Connection': 'keep-alive',
            // 'Cookie':'omgh5sid=745286838391-1516324661864; gr_user_id=3669f9f2-ada7-476e-9cdb-590773e1f994; omgtra=d3633d05-1167-4ed0-a0c6-6b27ae436c5a; UM_distinctid=1610bfe36e03f0-02cd7e651d3293-1f2a1709-100200-1610bfe36e150d; CNZZDATA1255043551=1543614147-1516319606-https%253A%252F%252Fes.xiaojukeji.com%252F%7C1516325008; auth_token=qfAO8dXE7ZvDf2dznHJGCVrIF1MUX%2FXM2lhHDe81HhpsdKfUc3tdnE4GuVGEIiieemV6A9zt%2F7mKYIJM4vC9grjue7dDAvMZMN3zO7l0%2F%2B2DRXmvUOTZbP2Gnx7F2izRan7mfsRuVR2qch3PC%2Bs0RvsfimLpdp9pC8EXbq474%2FTDgV2MMH9pvfS1K1gv41zJi26cl2GlHMgE7KWkvNnGbuwiib7B0rzy2%2FEvMszn%2BPDqUx94yXJxC0VoOBm62VMgJX7AJBESFL31J%2FmEtNnEp3v3cLt%2ByG%2F4xKImTuKvfbQ1Bm48OttBh0u911iwt83iJ8cNxjAkSAmBt3aLza1f3KWRfa8W8qe2KwqkKMOYmBWEgBHmvmZ%2BztBkQRvC14QwWMnrwA%2FtKwx7BcGm1w6iB4OPXX5ZVgb9nA266amRrXmU4G39NvXemNyEBz7hP%2FMLKnded7VKudU5AR4TBOJjPw%3D%3D74f9b0aade770b4ca2838db91c5ba61d274c5517',
            'Host': 'es.xiaojukeji.com',
            'Upgrade-Insecure-Requests': '1',

            'User-Agent': 'Mozilla/5.0 (X11; Windows x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
        }
    }
    //'https://es.xiaojukeji.com/Auth/getVerifyCode?phone=18755124987'
    https.get(options, (res) => {
        // console.log('statusCode:', res.statusCode);
        // console.log('headers:', res.headers);
        var _body = ''
        res.on('data', (d) => {
            _body += d;
        });

        res.on('end', (d) => {
            if (d) _body += d;
            logAndSave(_body, name)
            if (cb) {
                cb(`codes/code${name}.jpeg`)
            }
        })

    }).on('error', (e) => {
        console.error(e);
    })
}

function take300() {
    Rx.Observable.interval(500).takeWhile(x => x < 300).subscribe(x => fetchAndSave(x))
}
fetchAndSave.take300 = take300
module.exports = fetchAndSave
function write(text) {
    process.stdout.write(text);
}

const startIndex = 1000;
const times = 3;
const limit = startIndex + times - 1;

let index = startIndex;

function next() {
    if (current === limit) {
        return;
    }

    const current = index++;

    setTimeout(function () {
        write(JSON.stringify({ index: current, timestamp: (new Date()).getTime() }));
        next();
    }, current);
}

next();

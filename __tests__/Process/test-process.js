function write(text) {
    process.stdout.write(text);
}

const startIndex = 1000;
const times = 3;
const limit = startIndex + times - 1;

let index = startIndex;

function next() {
    const current = index++;

    if (current - 1 === limit) {
        return;
    }

    setTimeout(function () {
        write(JSON.stringify({ index: current, timestamp: (new Date()).getTime() }));
        next();
    }, current);
}

next();

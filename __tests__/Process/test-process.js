function write(text) {
    process.stdout.write(text);
}

const times = 3;
const interval = 1000;
let index = 1;

function next() {
    if (index === times + 1) {
        return;
    }

    const current = index++;

    setTimeout(function () {
        const timestamp = (new Date()).getTime();

        write(JSON.stringify({ index: current, timestamp }));
        next();
    }, interval);
}

next();

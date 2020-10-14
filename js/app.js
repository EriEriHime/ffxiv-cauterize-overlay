let pool = [];
let clearQueueId = null;

const check = (rx, log) => {
    const isReset = ResetRegex.test(log);
    if (isReset) return clear();
    const matched = log.match(rx);
    if (matched) pool.push(matched);
    if (pool.length != 5) return;
    const result = pool
        .map(ret => {
            const pos = ret.groups.pos.split("|");
            const px = parseFloat(pos[0]);
            const py = -1 * parseFloat(pos[1]);
            const rad = Math.atan2(py, px);
            const hash = (rad * (360 / (2 * Math.PI))).toFixed(0);
            return {
                rad,
                index: DragonPosMapping[hash],
            }
        })
        .sort((a, b) => a.index - b.index);
    const groups = [
        { group: "g1", ...result[0] },
        { group: "g1", ...result[1] },
        { group: "g2", ...result[2] },
        { group: "g3", ...result[3] },
        { group: "g3", ...result[4] },
    ];
    const hash = result.map(d => d.index).join('');
    console.log(`Result: ${JSON.stringify(groups)}`);
    draw(groups, hash);
    cleanup();
}

const cleanup = () => {
    pool = [];
}

const element = document.querySelector("#canvas");
const context = element.getContext("2d");

const drawDragon = (rad, group) => {
    context.beginPath();
    const rx = NORM * Math.cos(rad) + ORIGIN.x;
    const ry = NORM * -Math.sin(rad) + ORIGIN.y;
    context.arc(rx, ry, SIZE, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
    context.fillStyle = Color[group];
    context.fill();
    context.strokeStyle = "black";
    context.lineWidth = 4;
    context.stroke();
}
const drawPlayer = (rad, index) => {
    context.beginPath();
    const rx = P_NORM * Math.cos(rad) + ORIGIN.x;
    const ry = P_NORM * -Math.sin(rad) + ORIGIN.y;
    context.arc(rx, ry, SIZE * 1.5, 0 * Math.PI / 180, 360 * Math.PI / 180, false);
    context.fillStyle = "rgba(255, 255, 255, 1)";
    context.fill();
    context.strokeStyle = "black";
    context.lineWidth = 1;
    context.fillStyle = Color[`g${index}`];
    context.font = `32px consolas`;
    context.fillText(index, rx - SIZE / 2, ry + SIZE)
    context.stroke();
}
const draw = (groups, hash) => {
    console.log("Start Rendering.");
    groups.forEach(d => drawDragon(d.rad, d.group));
    const playerCirclePos = HashToCircle[hash];
    playerCirclePos.split(',').forEach((pos, i) => drawPlayer(CircleToRadian[pos], i + 1));
    element.style.display = "block";
    console.log("End Rendering.");
    clearQueueId = setTimeout(clear, Query.duration);
}

const clear = () => {
    clearTimeout(clearQueueId);
    console.log("Clear rendering.");
    element.style.display = "none";
    context.clearRect(0, 0, 600, 600);
}

const checkEvent = rx => e => check(rx, e.rawLine);

const setup = async () => {
    const language = await callOverlayHandler({ call: 'getLanguage' }).then(lang => lang.language);
    if (!AddedNewCombatantDragons[language]) {
        console.log(`RegExp is undefined for your language. Language: ${language}`)
        return;
    }

    const checkEventWithRX = checkEvent(AddedNewCombatantDragons[language]);

    addOverlayListener('ChangeZone', event => {
        const isReady = localStorage.getItem('isReady') == 'true';
        const nextReady = event.zoneID == ZONEID;
        if(isReady == nextReady) return;
        localStorage.setItem('isReady', nextReady);
        location.reload();
    });

    const isReady = localStorage.getItem('isReady') == 'true';

    if(isReady) {
        console.log("addOverlayListener: LogLine");
        addOverlayListener('LogLine', checkEventWithRX);
    }
    startOverlayEvents();
}

if (TestMode) {
    console.log("Test")
    const rx = AddedNewCombatantDragons["Japanese"];
    TestLogs.forEach(log => check(rx, log));
}

setup();

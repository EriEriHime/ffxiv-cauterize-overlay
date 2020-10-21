let dragons = [];
let clearQueueId = null;
let isAlreadyMatched = false;

const check = (rx, log, isTest = false) => {
    const isReset = ResetRegex.test(log);
    if (isReset) return reset();
    if(isAlreadyMatched) return;
    const matched = log.match(rx);
    if (matched) dragons.push(matched);
    if (dragons.length != 5) return;
    if(!isTest) isAlreadyMatched = true;
    const result = dragons
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
    dragons = [];
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
    context.stroke();

    context.fillStyle = Color[`g${index}`];
    context.font = `32px consolas`;
    context.textAlign = "center";
    context.fillText(index, rx, ry + SIZE);
}

const drawTextForCall = (text) => {
    const rx = ORIGIN.x;
    const ry = ORIGIN.y + context.canvas.height/2 - SIZE ;
    context.fillStyle = "rgba(255, 0, 255, 1)";
    context.strokeStyle = "black";
    context.font = `24px consolas`;
    context.textAlign = "center";
    context.fillText(text, rx, ry);
}

const draw = (groups, hash) => {
    console.log("Start Rendering.");
    groups.forEach(d => drawDragon(d.rad, d.group));
    const playerCirclePos = HashToCircle[hash];
    playerCirclePos.split(',').forEach((pos, i) => drawPlayer(CircleToRadian[pos], i + 1));
    drawTextForCall(playerCirclePos.replace(/,/g, ' '))
    element.style.display = "block";
    clearQueueId = setTimeout(clear, Query.duration);
    console.log("End Rendering.");
}

const clear = () => {
    clearTimeout(clearQueueId);
    element.style.display = "none";
    context.clearRect(0, 0, 600, 600);
    console.log("Clear Rendering.");
}

const reset = () => {
    console.log("Reset.");
    clear();
    isAlreadyMatched = false;
    return;
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
    TestLogs.forEach(log => check(rx, log, true));
}

setup();

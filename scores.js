function exportScores() {
    let file = new Blob([JSON.stringify(scores)], {type: "application/json"});
    let temp = document.createElement("temp");
    let url = URL.createObjectURL(file);
    temp.href = url;
    temp.download = "tetris-scores.json";
    document.body.appendChild(temp);
    temp.click();
    document.body.removeChild(temp);
    URL.revokeObjectURL(url);
}

const scoresTableKey = "scoresTable"
const scoresKey = "scores"
const newScoreIndexKey = "newScoreIndex"

let scoresElement = document.getElementById(scoresTableKey);
let scores = localStorage[scoresKey];
scores = scores !== undefined ? JSON.parse(scores) : [];

let newScoreIndex = +localStorage[newScoreIndexKey];
delete localStorage[newScoreIndexKey];

for (let [i, score] of scores.entries()) {
    let tr = document.createElement("tr");

    if (i === newScoreIndex) {
        tr.className = "new-score";
    }

    for (let key of Object.keys(score)) {
        let td = document.createElement("td");
        td.innerText = score[key];
        tr.appendChild(td);
    }

    scoresElement.tBodies.item(0).appendChild(tr);
}
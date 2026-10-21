const SAVE_KEY = 'philosophy-game-save-v1';

function newState() {
    return {
        location: START_LOCATION,
        unlocked: [START_LOCATION],
        pieces: [],        // 所持しているピースID（入手順）
        examined: [],      // 調べたオブジェクト "loc:obj"
        answered: {},      // questionId -> { stance, pieces }
        failures: {},      // questionId -> 失敗回数（ヒント用）
        ended: false,
    };
}

let state = load();
let mode = 'explore';      // 'explore' | 'synth' | 'answer'
let selection = [];        // 合成・回答で選んでいるピースID
let message = null;        // { title, text, kind }
let newPieceId = null;     // 直近に入手したピース（ハイライト用）

function load() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (raw) return Object.assign(newState(), JSON.parse(raw));
    } catch (e) { /* 保存が使えない環境でも遊べるようにする */ }
    return newState();
}

function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { }
}

const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else if (v !== false && v != null) node.setAttribute(k, v);
    }
    for (const c of children.flat()) {
        if (c == null) continue;
        node.append(c instanceof Node ? c : document.createTextNode(c));
    }
    return node;
}

// ── ゲームロジック ──

function gainPiece(id) {
    if (state.pieces.includes(id)) return false;
    state.pieces.push(id);
    newPieceId = id;
    return true;
}

function examine(locId, obj) {
    const key = `${locId}:${obj.id}`;
    const first = !state.examined.includes(key);
    if (first) state.examined.push(key);
    const got = gainPiece(obj.piece);
    message = {
        title: obj.label,
        text: obj.text,
        kind: 'story',
        piece: got ? obj.piece : null,
    };
    save();
    render();
}

function findRecipe(a, b) {
    return RECIPES.find(r =>
        (r.inputs[0] === a && r.inputs[1] === b) ||
        (r.inputs[0] === b && r.inputs[1] === a));
}

function synthesize() {
    const [a, b] = selection;
    const recipe = findRecipe(a, b);
    if (!recipe) {
        message = {
            title: '響き合わない',
            text: `「${PIECES[a].name}」と「${PIECES[b].name}」は、まだひとつの考えにならない。別の組み合わせを試してみよう。`,
            kind: 'fail',
        };
    } else if (state.pieces.includes(recipe.output)) {
        message = {
            title: 'すでに知っている考え',
            text: `この組み合わせからは「${PIECES[recipe.output].name}」が生まれる。あなたはもうそれを持っている。`,
            kind: 'info',
        };
    } else {
        gainPiece(recipe.output);
        message = {
            title: '新しい考えが生まれた',
            text: `「${PIECES[a].name}」と「${PIECES[b].name}」が重なり合い、ひとつの考えになった。`,
            kind: 'synth',
            piece: recipe.output,
        };
    }
    selection = [];
    mode = 'explore';
    save();
    render();
}

function matchAnswer(q, picked) {
    return q.answers.find(ans => ans.requires.every(id => picked.includes(id)));
}

function answer(qid) {
    const q = QUESTIONS[qid];
    const picked = [...selection];
    const ans = matchAnswer(q, picked);

    if (!ans) {
        state.failures[qid] = (state.failures[qid] || 0) + 1;
        message = {
            title: `${q.asker}は首をかしげた`,
            text: '「うーん……それでは、まだ答えになっていない気がするね」' + hintFor(qid),
            kind: 'fail',
        };
        selection = [];
        save();
        render();
        return;
    }

    const wasAnswered = !!state.answered[qid];
    state.answered[qid] = { stance: ans.stance, pieces: picked };
    const unlockedNow = [];
    for (const loc of q.unlocks) {
        if (!state.unlocked.includes(loc)) { state.unlocked.push(loc); unlockedNow.push(loc); }
    }
    if (!state.unlocked.includes('tower') && TOWER_REQUIRES.every(id => state.answered[id])) {
        state.unlocked.push('tower');
        unlockedNow.push('tower');
    }

    selection = [];
    mode = 'explore';

    if (q.final) {
        state.ended = true;
        save();
        render();
        showEnding(picked);
        return;
    }

    let text = ans.reply + `\n\nあなたの立場：${ans.stance}`;
    if (wasAnswered) text += '（答えを改めた）';
    if (unlockedNow.length) {
        text += '\n\n新しい場所へ行けるようになった：' + unlockedNow.map(id => LOCATIONS[id].name).join('、');
    }
    message = { title: `${q.asker}は頷いた`, text, kind: 'answer' };
    save();
    render();
}

function hintFor(qid) {
    const q = QUESTIONS[qid];
    if ((state.failures[qid] || 0) < 2) return '';
    // 手持ちで成立しうる答えがあればそのピースを、なければ不足を伝える
    for (const ans of q.answers) {
        if (ans.requires.length && ans.requires.every(id => state.pieces.includes(id))) {
            const names = ans.requires.map(id => `「${PIECES[id].name}」`).join('と');
            return `\n\n（ヒント：${names}を手がかりにしてみては？）`;
        }
    }
    return '\n\n（ヒント：まだ集めていない考えや、組み合わせて生まれる考えが必要かもしれない）';
}

function togglePick(id) {
    const q = mode === 'answer' ? QUESTIONS[LOCATIONS[state.location].question] : null;
    const max = mode === 'synth' ? 2 : q ? q.slots : 0;
    const i = selection.indexOf(id);
    if (i >= 0) selection.splice(i, 1);
    else if (selection.length < max) selection.push(id);
    render();
}

function setMode(next) {
    mode = next;
    selection = [];
    message = null;
    render();
}

function travel(locId) {
    state.location = locId;
    mode = 'explore';
    selection = [];
    message = null;
    save();
    render();
}

function reset() {
    if (!confirm('最初からやり直しますか？集めたピースはすべて失われます。')) return;
    state = newState();
    mode = 'explore';
    selection = [];
    message = null;
    newPieceId = null;
    save();
    $('ending').hidden = true;
    render();
}

// ── 描画 ──

function render() {
    renderMap();
    renderScene();
    renderNotebook();
    newPieceId = null;
}

function renderMap() {
    const nav = $('map');
    nav.replaceChildren();
    for (const [id, loc] of Object.entries(LOCATIONS)) {
        const open = state.unlocked.includes(id);
        const q = QUESTIONS[loc.question];
        const done = q && state.answered[loc.question];
        nav.append(el('button', {
            class: 'map-btn' + (id === state.location ? ' current' : '') + (done ? ' done' : ''),
            disabled: !open,
            onclick: () => travel(id),
        }, open ? loc.name : '？？？'));
    }
}

function renderScene() {
    const loc = LOCATIONS[state.location];
    const scene = $('scene');
    scene.replaceChildren();

    scene.append(el('h2', { class: 'scene-title' }, loc.name));
    scene.append(el('p', { class: 'scene-intro' }, loc.intro));

    if (loc.objects.length) {
        const list = el('div', { class: 'objects' });
        for (const obj of loc.objects) {
            const seen = state.examined.includes(`${state.location}:${obj.id}`);
            list.append(el('button', {
                class: 'object-btn' + (seen ? ' seen' : ''),
                onclick: () => examine(state.location, obj),
                disabled: mode !== 'explore',
            }, (seen ? '✓ ' : '◇ ') + obj.label));
        }
        scene.append(list);
    }

    const qid = loc.question;
    const q = QUESTIONS[qid];
    if (q) {
        const prev = state.answered[qid];
        const box = el('div', { class: 'question' + (mode === 'answer' ? ' active' : '') },
            el('div', { class: 'asker' }, q.asker),
            el('p', { class: 'question-text' }, q.text),
        );
        if (prev && mode !== 'answer') {
            box.append(el('p', { class: 'stance' },
                `あなたの答え：${prev.pieces.map(id => PIECES[id].name).join(' ＋ ')} → ${prev.stance}`));
        }
        if (mode === 'answer') {
            box.append(renderSlots(q.slots));
            box.append(el('div', { class: 'actions' },
                el('button', {
                    class: 'primary',
                    disabled: selection.length !== q.slots,
                    onclick: () => answer(qid),
                }, 'この考えで答える'),
                el('button', { onclick: () => setMode('explore') }, 'やめる'),
            ));
            box.append(el('p', { class: 'help' }, `思考ノートからピースを${q.slots}つ選んでください。`));
        } else if (!(q.final && state.ended)) {
            box.append(el('div', { class: 'actions' },
                el('button', {
                    class: 'primary',
                    disabled: mode !== 'explore' || state.pieces.length < q.slots,
                    onclick: () => setMode('answer'),
                }, prev ? '答えを考え直す' : '問いに向き合う'),
            ));
            if (state.pieces.length < q.slots) {
                box.append(el('p', { class: 'help' }, `答えるには、ピースが${q.slots}つ以上必要です。まずはあたりを調べてみよう。`));
            }
        }
        scene.append(box);
    }

    if (message) scene.append(renderMessage(message));
}

function renderSlots(n) {
    const row = el('div', { class: 'slots' });
    for (let i = 0; i < n; i++) {
        const id = selection[i];
        row.append(el('div', { class: 'slot' + (id ? ' filled' : '') },
            id ? PIECES[id].name : '　'));
        if (i < n - 1) row.append(el('span', { class: 'plus' }, '＋'));
    }
    return row;
}

function renderMessage(m) {
    const box = el('div', { class: `message ${m.kind}` },
        el('div', { class: 'message-title' }, m.title),
        ...m.text.split('\n').map(line => el('p', {}, line)),
    );
    if (m.piece) {
        const p = PIECES[m.piece];
        box.append(el('div', { class: 'gained' },
            el('span', { class: 'gained-label' }, p.kind === 'synth' ? '合成ピース獲得' : 'ピース獲得'),
            el('strong', {}, `「${p.name}」`),
            el('span', {}, p.text)));
    }
    return box;
}

function renderNotebook() {
    const synthCount = state.pieces.filter(id => PIECES[id].kind === 'synth').length;
    const totalSynth = Object.values(PIECES).filter(p => p.kind === 'synth').length;
    $('piece-count').textContent = `${state.pieces.length} ピース（合成 ${synthCount}/${totalSynth}）`;

    const tools = $('notebook-tools');
    tools.replaceChildren();
    if (mode === 'synth') {
        tools.append(
            renderSlots(2),
            el('div', { class: 'actions' },
                el('button', { class: 'primary', disabled: selection.length !== 2, onclick: synthesize }, '組み合わせる'),
                el('button', { onclick: () => setMode('explore') }, 'やめる')),
            el('p', { class: 'help' }, 'ふたつのピースを選ぶと、新しい考えが生まれるかもしれない。'),
        );
    } else if (mode === 'explore') {
        tools.append(el('button', {
            class: 'secondary',
            disabled: state.pieces.length < 2,
            onclick: () => setMode('synth'),
        }, '⚗ ピースを組み合わせる'));
    }

    const grid = $('pieces');
    grid.replaceChildren();
    if (!state.pieces.length) {
        grid.append(el('p', { class: 'empty' }, 'まだ何も考えていない。場所を調べて、思考のピースを集めよう。'));
        return;
    }
    const picking = mode !== 'explore';
    for (const id of state.pieces) {
        const p = PIECES[id];
        const order = selection.indexOf(id);
        grid.append(el('button', {
            class: ['piece', p.kind, order >= 0 ? 'picked' : '', id === newPieceId ? 'new' : '', picking ? 'pickable' : ''].join(' '),
            disabled: !picking,
            onclick: () => togglePick(id),
        },
            el('span', { class: 'piece-name' }, p.name),
            el('span', { class: 'piece-text' }, p.text),
        ));
    }
}

function showEnding(picked) {
    const stances = Object.entries(state.answered)
        .filter(([qid]) => !QUESTIONS[qid].final)
        .map(([qid, a]) => ({ asker: QUESTIONS[qid].asker, q: QUESTIONS[qid].text, stance: a.stance }));

    const body = $('ending-body');
    body.replaceChildren(
        el('p', {}, '台座に置いた3つの考えが、静かに溶け合っていく。'),
        el('ul', { class: 'ending-pieces' },
            picked.map(id => el('li', {}, el('strong', {}, `「${PIECES[id].name}」`), PIECES[id].text))),
        el('p', {}, 'それが、今のあなただ。けれど旅のあいだ、あなたはこう答えてきた——'),
        el('ul', { class: 'ending-stances' },
            stances.map(s => el('li', {}, el('span', { class: 'muted' }, `${s.q}`), el('br'), `→ ${s.stance}`))),
        el('p', {}, 'どの答えも、最終的な答えではない。問いはいつでも、もう一度あなたの前に現れる。'),
        el('p', { class: 'muted' }, `集めたピース：${state.pieces.length} / ${Object.keys(PIECES).length}`),
    );
    $('ending').hidden = false;
}

$('reset-btn').addEventListener('click', reset);
$('ending-close').addEventListener('click', () => { $('ending').hidden = true; });

render();

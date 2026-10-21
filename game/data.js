// ゲームの内容データ。ここを編集すれば、場所・ピース・問いを追加できる。

// 思考のピース
// kind: "base"（探索で拾う） / "synth"（合成で生まれる）
const PIECES = {
    // ── 洞窟 ──
    shadow:   { name: '影',             kind: 'base',  text: '見えているものは、本物の写しにすぎないのかもしれない。' },
    chains:   { name: '囚われ',         kind: 'base',  text: '慣れ親しんだ世界が檻であることに、囚われた者は気づかない。' },
    light:    { name: '光',             kind: 'base',  text: '真実はまぶしい。最初は目を痛め、人は顔をそむける。' },

    // ── 図書館 ──
    doubt:    { name: '疑い',           kind: 'base',  text: '感覚も、記憶も、数学さえも、疑おうと思えば疑える。' },
    wax:      { name: '変化する蝋',     kind: 'base',  text: '火にかざすと形も匂いも変わる。それでも「同じ蝋だ」と分かる。' },
    thinker:  { name: '考える私',       kind: 'base',  text: '疑っているあいだ、疑っている「私」だけは消せない。' },

    // ── 港 ──
    planks:   { name: '取り替えられた板', kind: 'base', text: '古い板を一枚ずつ新しくしていった。最後の一枚を替えたとき、これはまだ同じ船か。' },
    river:    { name: '流れる川',       kind: 'base',  text: '同じ川に二度入ることはできない。水はもう別の水だから。' },
    memory:   { name: '記憶',           kind: 'base',  text: '昨日の私を覚えていること。それが、私を私につなぎとめる糸。' },

    // ── 広場 ──
    ignorance:{ name: '無知の知',       kind: 'base',  text: '自分が知らないということを、少なくとも私は知っている。' },
    why:      { name: 'なぜ',           kind: 'base',  text: '子どもは何度でも「なぜ？」と訊く。大人はいつ訊くのをやめたのか。' },
    gaze:     { name: '他者のまなざし', kind: 'base',  text: '誰かに見られたとき、私は初めて「見られる私」になる。' },
    contract: { name: '約束',           kind: 'base',  text: '人は互いに約束し、その約束が社会という見えない建物を支えている。' },

    // ── 合成ピース ──
    idea:     { name: 'イデア',             kind: 'synth', text: '移ろう影の向こうに、決して変わらない「形」がある。' },
    cogito:   { name: '我思う、ゆえに我あり', kind: 'synth', text: 'すべてを疑いつくした果てに、疑う私の存在だけが残る。' },
    flux:     { name: '万物流転',           kind: 'synth', text: '変わらないものなど何もない。あるのは流れだけだ。' },
    self:     { name: '連続する自己',       kind: 'synth', text: '部品が替わっても、つながりが続くかぎり、それは同じ「私」だ。' },
    cave2:    { name: '常識という洞窟',     kind: 'synth', text: 'みんなが見ている世界こそ、いちばん気づきにくい洞窟だ。' },
    seeker:   { name: '問いつづける心',     kind: 'synth', text: '答えを持つことではなく、問いを手放さないことが知恵である。' },
    freedom:  { name: '自由の重さ',         kind: 'synth', text: '鎖を外されたとき、人は何を選ぶかの責任を負うことになる。' },
};

// 合成レシピ（順不同の2ピース → 新しいピース）
const RECIPES = [
    { inputs: ['shadow', 'light'],    output: 'idea' },
    { inputs: ['doubt', 'thinker'],   output: 'cogito' },
    { inputs: ['river', 'wax'],       output: 'flux' },
    { inputs: ['planks', 'memory'],   output: 'self' },
    { inputs: ['chains', 'gaze'],     output: 'cave2' },
    { inputs: ['ignorance', 'why'],   output: 'seeker' },
    { inputs: ['chains', 'contract'], output: 'freedom' },
];

// 場所。objects を調べるとピースが手に入る。
const LOCATIONS = {
    cave: {
        name: '洞窟',
        intro: 'ひんやりとした岩の匂い。背後で焚き火がはぜ、壁には揺れる影が映っている。奥には、出口らしき白い光が細く差し込んでいる。',
        objects: [
            { id: 'wall',  label: '壁の影を見る',     piece: 'shadow', text: '壁を動く影は、まるで生きているようだ。だがそれは、背後を通る何かの「写し」にすぎない。' },
            { id: 'chain', label: '足元の鎖に触れる', piece: 'chains', text: '錆びた鎖が、岩に打ち込まれている。かつてここに誰かが繋がれていた。その人は、鎖を不自由だと思っていただろうか。' },
            { id: 'exit',  label: '出口の光へ近づく', piece: 'light',  text: '一歩近づくたび、光が目を刺す。思わず後ずさりしたくなる。真実とは、こういうものかもしれない。' },
        ],
        question: 'q_cave',
    },
    library: {
        name: '図書館',
        intro: '天井まで届く書架。埃の舞う光の中に、誰かが書きかけた手記が開いたまま置かれている。',
        objects: [
            { id: 'notes',  label: '開いた手記を読む', piece: 'doubt',   text: '「私はこれまで、真だと思ってきたものをすべて、一度は疑ってみることにした」——インクはまだ乾いていない。' },
            { id: 'candle', label: '蝋燭を手に取る',   piece: 'wax',     text: '溶けた蝋が指に垂れる。冷えた塊とはまるで別物なのに、あなたはそれを迷わず「蝋」と呼ぶ。' },
            { id: 'mirror', label: '古い鏡をのぞく',   piece: 'thinker', text: '鏡の中の自分は本物だろうか。……だが、そう疑っているこの意識だけは、どうしても否定できない。' },
        ],
        question: 'q_library',
    },
    harbor: {
        name: '港',
        intro: '潮風と、木を削る音。桟橋には、何度も修理された古い船が係留されている。河口から川の水が海へ流れ込んでいる。',
        objects: [
            { id: 'ship',  label: '古い船を調べる', piece: 'planks', text: '船大工が言う。「この船はテセウスの船さ。板は全部、ひとつ残らず新しくしてある」' },
            { id: 'river', label: '川に手を浸す',   piece: 'river',  text: '指のあいだを水がすり抜けていく。今触れた水には、もう二度と触れられない。' },
            { id: 'sail',  label: '古い帆を広げる', piece: 'memory', text: '帆には、これまでの航海の日付が縫い込まれている。船は板ではなく、この記録を覚えているのかもしれない。' },
        ],
        question: 'q_harbor',
    },
    agora: {
        name: '広場',
        intro: '人々が行き交い、議論する声があちこちから聞こえる。噴水のそばで、裸足の老人が若者たちに何かを問いかけている。',
        objects: [
            { id: 'oldman', label: '裸足の老人の話を聞く', piece: 'ignorance', text: '「わしは何も知らん。ただ、知らんということだけは知っておる。それだけ、皆より少し賢いのかもしれんな」' },
            { id: 'child',  label: '子どもに話しかける',   piece: 'why',       text: '「どうして空は青いの？」「どうして人は死ぬの？」「どうして、どうして？」——あなたはひとつも答えられなかった。' },
            { id: 'crowd',  label: '群衆の中に立つ',       piece: 'gaze',      text: 'ふと、誰かの視線を感じる。その瞬間、あなたは自分の姿勢や表情を意識しはじめた。' },
            { id: 'board',  label: '掲示板を読む',         piece: 'contract',  text: '「市民は互いの財産を侵さぬことを誓う」——誰がいつ、この約束に署名したのだろう。あなたは署名した覚えがない。' },
        ],
        question: 'q_agora',
    },
    tower: {
        name: '問いの塔',
        intro: '螺旋階段の頂上。窓の外には、これまで歩いた洞窟も、図書館も、港も、広場も見える。部屋の中央に、空っぽの台座がある。',
        objects: [],
        question: 'q_tower',
    },
};

// 問い。slots 個のピースを置いて答える。
// answers は上から順に判定し、requires のピースがすべて含まれていれば成立。
// requires が空の answer は「どの組み合わせでも成立する」受け皿。
const QUESTIONS = {
    q_cave: {
        asker: '洞窟の番人',
        text: 'おまえが見ているこの世界は、本物か？',
        slots: 2,
        answers: [
            { requires: ['idea'],             stance: 'イデア論者',   reply: '「影の向こうに、変わらぬ形がある……か。ならば行け。光の方へ」' },
            { requires: ['shadow', 'light'],  stance: '洞窟を出る者', reply: '「見えているのは影。だが光がある以上、本物もどこかにある。そう信じるのだな」' },
            { requires: ['chains', 'light'],  stance: '解放を望む者', reply: '「鎖に気づいた者だけが、痛みとともに外へ出られる。よかろう」' },
            { requires: ['shadow', 'chains'], stance: '囚われを知る者', reply: '「影しか見えぬよう縛られている、と。気づいただけでも、半歩は外に出ている」' },
        ],
        unlocks: ['library', 'harbor'],
    },
    q_library: {
        asker: '司書',
        text: 'この世界に、確かなものはひとつでもありますか？',
        slots: 2,
        answers: [
            { requires: ['cogito'],           stance: '合理論者',   reply: '「疑う私だけは疑えない。あなたは、確かさの最初の一点を見つけたのですね」' },
            { requires: ['doubt', 'thinker'], stance: '方法的懐疑者', reply: '「疑いを道具にして、考える私にたどり着く。その道筋は正しい」' },
            { requires: ['doubt', 'shadow'],  stance: '懐疑論者',   reply: '「すべては影で、何ひとつ確かではない……。それもまた、ひとつの誠実な答えです」' },
            { requires: ['idea'],             stance: 'イデア論者', reply: '「変わらぬ形こそが確かなもの。目ではなく、理性で見るものですね」' },
        ],
        unlocks: ['agora'],
    },
    q_harbor: {
        asker: '船大工',
        text: '板をぜんぶ取り替えたこの船は、まだ同じ船だと思うかい？',
        slots: 2,
        answers: [
            { requires: ['self'],             stance: '連続性の擁護者', reply: '「つながりが続いている限り、同じ船か。じゃあ、あんた自身もそうなんだろうな」' },
            { requires: ['flux'],             stance: '流転論者',     reply: '「同じものなんて最初からない、か。はは、船大工には耳の痛い話だ」' },
            { requires: ['idea'],             stance: 'イデア論者',   reply: '「板じゃなく『船の形』が同じなら同じ船だと。設計図のほうが本体ってわけだ」' },
            { requires: ['planks', 'memory'], stance: '記憶の擁護者', reply: '「航海を覚えている限り、こいつはこいつか。悪くない答えだ」' },
            { requires: ['river', 'planks'],  stance: '流転論者',     reply: '「川の水と同じで、船も毎日別物になっている……そう言われちゃかなわんな」' },
        ],
        unlocks: ['agora'],
    },
    q_agora: {
        asker: '裸足の老人',
        text: 'では訊こう。「よく生きる」とは、どういうことかね？',
        slots: 2,
        answers: [
            { requires: ['seeker'],             stance: '問う者',       reply: '「問いを手放さぬこと、か。うむ。わしもそれ以外の答えを知らん」' },
            { requires: ['freedom'],            stance: '実存主義者',   reply: '「選び、その重さを引き受けること。おぬしは自由の怖さを知っておるな」' },
            { requires: ['cave2'],              stance: '批判者',       reply: '「皆が信じる常識を疑いながら生きる。嫌われるぞ。わしのようにな」' },
            { requires: ['contract', 'gaze'],   stance: '社会契約論者', reply: '「他者とともに約束を守って生きる。なるほど、人はひとりでは人になれんか」' },
            { requires: ['ignorance', 'why'],   stance: '問う者',       reply: '「知らぬと知り、なぜと問う。それが始まりで、たぶん終わりもそれだ」' },
            { requires: ['cogito'],             stance: '合理論者',     reply: '「考える私から出発して生きる、か。だが考えるだけで足りるかの？」' },
        ],
        unlocks: [],
    },
    q_tower: {
        asker: '空っぽの台座',
        text: '——あなたは、誰か？（ここではどの3つのピースを置いても答えになる）',
        slots: 3,
        answers: [
            { requires: [], stance: 'あなた自身', reply: '台座に置いたピースが、ゆっくりとひとつの形に溶け合っていく。' },
        ],
        unlocks: [],
        final: true,
    },
};

// 塔が開く条件：これらの問いにすべて答えていること
const TOWER_REQUIRES = ['q_library', 'q_harbor', 'q_agora'];

const START_LOCATION = 'cave';

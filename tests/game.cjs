const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../dist/engine.js');
const seen=new Set();
for(let n=0;n<730;n++){
 const date=new Date(Date.UTC(2026,0,1+n)).toISOString().slice(0,10),p=E.daily(date),again=E.daily(date);
 assert.deepEqual(p,again,'Same date is deterministic');assert(!seen.has(p.id),'Different dates must have different boards');seen.add(p.id);
 assert.equal(p.solution.length,2+p.weekday,'Difficulty increases Sunday through Saturday');
 const board=p.seeds.slice();p.solution.forEach((w,i)=>{const r=E.check(board,w);assert.equal(r.ok,true);assert.equal(r.win,i===p.solution.length-1);board.push(w)});
}
assert(E.daily('2028-02-29'));assert.throws(()=>E.daily('2026-02-29'));assert.throws(()=>E.daily('nonsense'));
function harness(saved,now='2026-10-07T12:00:00Z'){
 const elements=new Map(),clock={value:now};
 class MockDate extends Date{constructor(...args){super(...(args.length?args:[clock.value]));}static now(){return new Date(clock.value).getTime();}}
 function el(){return {value:'',textContent:'',disabled:false,className:'',style:{},dataset:{},children:[],attributes:{},classList:{toggle(){}},setAttribute(k,v){this.attributes[k]=v},addEventListener(){},append(child){this.children.push(child)},replaceChildren(){this.children=[]},focus(){},showModal(){this.open=true},close(){this.open=false},remove(){}}}
 const storage={data:saved||null,getItem(){return this.data},setItem(k,v){this.data=v}};
 const context={console,Map,Set,Date:MockDate,Math,JSON,localStorage:storage,document:{hidden:false,addEventListener(){},getElementById(id){if(!elements.has(id))elements.set(id,el());return elements.get(id)},createElement:el},matchMedia:()=>({matches:true}),setTimeout:()=>{},setInterval:()=>{},window:{}};context.window=context;vm.createContext(context);
 for(const f of ['dictionary.js','engine.js','app.js'])vm.runInContext(fs.readFileSync(__dirname+'/../dist/'+f,'utf8'),context);
 return {run:s=>vm.runInContext(s,context),elements,storage,clock};
}
const h=harness();assert.equal(h.run('activeDate'),'2026-10-07');assert.equal(h.run('playing'),false);assert.equal(h.run('state.hints'),3);
h.run('start();enter("A",0)');assert.equal(h.run('score()'),1);assert.equal(h.run('selected'),1);
h.run("$('autoNext').onclick();enter('B',1)");assert.equal(h.run('selected'),1);assert.equal(h.run('score()'),2);
const boardId=h.run('puzzle.id');h.run("openDate('2026-10-06');start();enter('C',0);openDate('2026-10-07')");assert.equal(h.run('puzzle.id'),boardId);assert.equal(h.run('draft.size'),2);assert.equal(h.run('draft.get(0)'),'A');
const reload=harness(h.storage.data);assert.equal(reload.run('draft.size'),2);assert.equal(reload.run('state.autoNext'),false);assert.equal(reload.run('puzzle.id'),boardId);
h.run("$('clear').onclick();submit()");assert.equal(h.run('state.wrong'),0);
h.run("enter('Z',0);submit()");assert.equal(h.run('state.wrong'),1);assert.equal(h.run('dateWrong'),1);assert.equal(h.run('state.correctStreak'),0);assert.match(h.elements.get('message').textContent,/^Incorrect/);
h.run("$('clear').onclick();for(const w of puzzle.solution){direction(w.d);for(const p of E.cells(w))enter(p.ch,p.r*15+p.c);submit();}");assert(h.run('done'));assert.equal(h.run('state.wins'),1);assert.equal(h.run("state.dailyRecords['2026-10-07'].score"),h.run('score()'));assert.equal(h.elements.get('win').open,true);
const hints=h.run('state.hints'),wins=h.run('state.wins');h.run("openDate('2026-10-06');openDate('2026-10-07');submit();start()");assert.equal(h.run('state.wins'),wins);assert.equal(h.run('state.hints'),hints);assert(h.run('done'));
h.run('showArchive()');assert.equal(h.elements.get('calendar').children.length,35);const cells=h.elements.get('calendar').children;assert(cells.some(c=>c.className.includes('completed')&&c.textContent.includes('pts')));assert(cells.some(c=>c.className.includes('in-progress')));assert(cells.filter(c=>c.className.includes('calendar-day')).slice(7).every(c=>c.disabled));
h.run("calendarMonth='2026-01';renderCalendar();changeMonth(-1)");assert.equal(h.run('calendarMonth'),'2026-01');assert(h.elements.get('prevMonth').disabled);
h.run("openDate('2026-10-08')");assert.equal(h.run('activeDate'),'2026-10-07');h.run("openDate('2025-12-31')");assert.equal(h.run('activeDate'),'2026-10-07');
h.clock.value='2026-10-08T00:00:01Z';h.run('checkNewDay()');assert.equal(h.run('activeDate'),'2026-10-07');assert.equal(h.elements.get('todayButton').disabled,false);h.run("$('todayButton').onclick()");assert.equal(h.run('activeDate'),'2026-10-08');assert.equal(h.run('playing'),false);h.run('start()');assert.equal(h.run('state.streak'),2);
const old=harness(JSON.stringify({hints:9,wrong:4,correctStreak:2,active:{words:[],done:true,puzzle:{level:1}}}));assert.equal(old.run('state.hints'),9);assert.equal(old.run('state.wrong'),4);assert.equal(old.run('state.correctStreak'),2);assert.equal(old.run('playing'),false);assert(old.run('!!state.legacyActive'));
const timezoneA=harness(null,'2026-10-07T23:00:00-07:00'),timezoneB=harness(null,'2026-10-08T15:00:00+09:00');assert.equal(timezoneA.run('activeDate'),timezoneB.run('activeDate'));assert.equal(timezoneA.run('puzzle.id'),timezoneB.run('puzzle.id'));
// Same final paths and letter-only score remain supported.
const shot=harness();shot.run(`playing=true;done=false;words=[{text:'SAND',r:4,c:3,d:'H'},{text:'OAK',r:8,c:11,d:'V'}];draft.clear();for(const w of [{text:'DANCE',r:4,c:6,d:'V'},{text:'EMBRYO',r:8,c:6,d:'H'}])for(const p of E.cells(w))enter(p.ch,p.r*15+p.c);`);assert.equal(shot.run('done'),false);assert.equal(shot.run('score()'),8);shot.run('submit()');assert.equal(shot.run('score()'),11);assert(shot.run('done'));
console.log('PASS: 730 deterministic, unique, solvable daily boards; seven increasing difficulty bands; leap-date validation; UTC consistency; saved drafts and archive switching; scoring, submission, wrong-answer reset; one-time completion; locked future dates; midnight rollover; legacy rewards preserved.');

// Repeated words are legal at a new placement: reproduce BERRY / BERRY / BEIGE / MAGIC.
const repeated=harness();repeated.run(`playing=true;done=false;words=[{text:'BERRY',r:8,c:5,d:'H'},{text:'MAGIC',r:1,c:11,d:'V'}];draft.clear();for(const w of [{text:'BERRY',r:4,c:9,d:'V'},{text:'BEIGE',r:4,c:9,d:'H'}])for(const p of E.cells(w))enter(p.ch,p.r*15+p.c);submit();`);assert.equal(repeated.run('done'),true);assert.equal(repeated.run('score()'),10);assert.equal(repeated.run('dateWrong'),0);
assert(E.check([{text:'BERRY',r:8,c:5,d:'H'}],{text:'BERRY',r:8,c:5,d:'H'}).error,'Same placement still cannot be added twice');
console.log('PASS: repeated BERRY at a new crossing is accepted; screenshot solution wins at 10 points.');

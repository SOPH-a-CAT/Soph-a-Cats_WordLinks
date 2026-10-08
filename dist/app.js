const $=id=>document.getElementById(id), E=WL, KEY='bostonian-word-links-v1';
const fresh=()=>({autoNext:true,hints:3,best:{},seen:[],wins:0,wrong:0,correctStreak:0,streak:0,lastDay:null,active:null});
let state;try{state=Object.assign(fresh(),JSON.parse(localStorage.getItem(KEY)||'null'));}catch{state=fresh();}
const todayKey=()=>new Date().toISOString().slice(0,10);
let activeDate=todayKey(), calendarMonth=activeDate.slice(0,7), lastToday=activeDate;
// Keep prior practice-game data, hint balances, and streaks when upgrading.
state.dailyRecords=state.dailyRecords||{};
if(state.active&&!state.legacyActive)state.legacyActive=state.active;
let puzzle=null,words=[],playing=false,done=false,dir='H',selected=112,draft=new Map(),hinted=new Set(),credited=new Set(),storageOK=true,dateWrong=0;
E.common.forEach(w=>WORDS.add(w));
const day=()=>Math.floor(new Date(todayKey()+'T00:00:00Z').getTime()/86400000);
if(state.lastDay!==null&&day()-state.lastDay>1)state.streak=0;
function save(){
 if(puzzle&&playing)state.dailyRecords[activeDate]={words,done,playing,draft:[...draft],hinted:[...hinted],credited:[...credited],dir,selected,wrong:dateWrong,score:done?score():null};
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch{storageOK=false;}
}
function countDay(){let bonus=0,today=day();if(state.lastDay!==today){state.streak=state.lastDay===today-1?state.streak+1:1;state.lastDay=today;if(state.streak%5===0){bonus=state.streak/5;state.hints+=bonus;}}save();return bonus;}
function pretty(date,options={weekday:'long',month:'short',day:'numeric',year:'numeric'}){return new Date(date+'T00:00:00Z').toLocaleDateString('en-US',{...options,timeZone:'UTC'});}
function score(){return words.slice(2).reduce((n,w)=>n+w.text.length,0)+draft.size}
function message(text,error=false){$('message').textContent=text;$('message').classList.toggle('error',error);}
function update(){
 $('autoNext').textContent='Auto-next: '+(state.autoNext?'On':'Off');$('autoNext').setAttribute('aria-pressed',String(state.autoNext));
 $('directionHelp').textContent=state.autoNext?'Typing moves to the next box. Use Across or Down below to change direction.':'Typing stays in the same box. Click another box or use the arrow keys to move.';
 const record=state.dailyRecords[activeDate];
 $('score').textContent=score();$('best').textContent=done?score():record?.score??'—';$('dateStatus').textContent=done?'Completed':playing?'In progress':'Not started';
 $('puzzleDate').textContent=pretty(activeDate,{month:'short',day:'numeric'});
 $('startBest').textContent=pretty(activeDate);
 $('start').textContent=activeDate===todayKey()?"Start today's puzzle":'Start this puzzle';
 $('todayButton').disabled=activeDate===todayKey();
 $('progressSummary').textContent=Object.values(state.dailyRecords).filter(r=>r.done).length+' days solved';
 $('progressDetail').textContent=Object.values(state.dailyRecords).filter(r=>r.playing&&!r.done).length+' in progress · saved on this device';
 $('hints').textContent=state.hints;$('streak').textContent=state.streak+' day'+(state.streak===1?'':'s')+' streak';
 $('winProgress').textContent=(state.correctStreak%3)+' / 3 correct to your next hint';$('correctStreak').textContent=state.correctStreak+' correct in a row';$('wrongCount').textContent=dateWrong+' wrong this puzzle';
 $('wordCount').textContent=Math.max(0,words.length-2)+' words linked';
 $('hint').disabled=!playing||done||state.hints<1;$('add').disabled=!playing||done;$('undo').disabled=!playing||done||words.length<=2;$('clear').disabled=!playing||done;$('startOverlay').hidden=playing;
 $('date').textContent=pretty(activeDate).toUpperCase()+' · UTC';
}
const inputs=[];for(let i=0;i<225;i++){const el=document.createElement('input');el.className='cell';el.type='text';el.maxLength=1;el.autocomplete='off';el.setAttribute('autocapitalize','characters');el.spellcheck=false;el.setAttribute('aria-label',`Row ${Math.floor(i/15)+1}, column ${i%15+1}`);el.setAttribute('role','gridcell');el.dataset.index=i;el.addEventListener('focus',()=>{selected=i;highlight();});el.addEventListener('click',()=>{selected=i;highlight();});el.addEventListener('keydown',e=>key(e,i));el.addEventListener('input',()=>{const ch=el.value.toUpperCase().replace(/[^A-Z]/g,'').slice(-1);if(ch)enter(ch,i);else{draft.delete(i);render();}});el.addEventListener('paste',e=>{e.preventDefault();const text=e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z]/g,'');let p=i;for(const ch of text){if(p<0||p>=225)break;put(ch,p);const n=advance(p,1);if(n===p)break;p=n;}selected=p;draftChanged();render();if(!done)inputs[p].focus();});$('board').append(el);inputs.push(el);}
function highlight(){inputs.forEach((el,i)=>el.classList.toggle('selected',i===selected&&playing&&!done));}
function render(){const m=E.map(words);inputs.forEach((el,i)=>{const p=m.get(i);el.value=p?.ch||draft.get(i)||'';el.disabled=!playing||done;el.readOnly=!!p;el.className='cell'+(p?(p.ids.includes(0)?' seed0':p.ids.includes(1)?' seed1':' added'):'')+(draft.has(i)?' draft':'')+(hinted.has(i)?' hinted':'');el.setAttribute('aria-label',`Row ${Math.floor(i/15)+1}, column ${i%15+1}${el.value?', '+el.value:''}${p?', fixed letter':''}`);});highlight();save();update();}
function advance(i,n){let next=i+(dir==='H'?n:n*15);return next<0||next>=225||(dir==='H'&&Math.floor(next/15)!==Math.floor(i/15))?i:next;}
function put(ch,i){const p=E.map(words).get(i);if(p&&p.ch!==ch){message('That letter is fixed. Use '+p.ch+' at the crossing.',true);return false;}if(!p)draft.set(i,ch);return true;}
function enter(ch,i){if(!playing||done)return;if(put(ch,i)){selected=state.autoNext?advance(i,1):i;draftChanged();render();if(!done)inputs[selected].focus();}else render();}
function key(e,i){if(!playing||done)return;if(/^[a-zA-Z]$/.test(e.key)){e.preventDefault();enter(e.key.toUpperCase(),i);}else if(e.key==='Backspace'||e.key==='Delete'){e.preventDefault();if(draft.has(i))draft.delete(i);else{selected=advance(i,-1);draft.delete(selected);}render();inputs[selected].focus();}else if(e.key==='Enter'){e.preventDefault();submit();}else if(e.key.startsWith('Arrow')){e.preventDefault();let next=i+({ArrowRight:1,ArrowLeft:-1,ArrowUp:-15,ArrowDown:15}[e.key]);if(next>=0&&next<225&&(!(e.key==='ArrowRight'||e.key==='ArrowLeft')||Math.floor(next/15)===Math.floor(i/15))){selected=next;inputs[next].focus();}}}
function direction(d){dir=d;hinted.clear();$('across').classList.toggle('active',d==='H');$('down').classList.toggle('active',d==='V');$('across').setAttribute('aria-pressed',d==='H');$('down').setAttribute('aria-pressed',d==='V');render();if(playing&&!done)inputs[selected].focus();}
function candidate(){if(!draft.size)return null;const ids=[...draft.keys()].sort((a,b)=>a-b),base=ids[0];if(ids.some(i=>dir==='H'?Math.floor(i/15)!==Math.floor(base/15):i%15!==base%15))return {error:'Not quite yet. Check that your words are complete and cross at matching letters. You can edit the yellow letters and submit again.'};const m=E.map(words),has=i=>draft.has(i)||m.has(i),step=dir==='H'?1:15;let a=ids[0],b=ids[ids.length-1];while(advance(a,-1)!==a&&has(a-step))a-=step;while(advance(b,1)!==b&&has(b+step))b+=step;let text='';for(let i=a;i<=b;i+=step){if(!has(i))return {error:'Fill every square in your word before adding it.'};text+=draft.get(i)||m.get(i).ch;}return {text,r:Math.floor(a/15),c:a%15,d:dir};}
function incorrect(reason){
 state.wrong++;dateWrong++;state.correctStreak=0;save();update();
 message('Incorrect. '+reason+' Your correct-answer streak is broken.',true);
}
function submit(){
 if(!playing||done)return;
 if(!draft.size)return message('Type an answer before submitting. No wrong answer counted.',true);
 const plan=E.planDraft(words,draft,WORDS);if(plan)return applyPlan(plan);
 const w=candidate();if(w?.error)return incorrect(w.error);
 if(!w)return;
 if(!WORDS.has(w.text))return incorrect('“'+w.text+'” isn’t in our word list. Try another word.');
 const result=E.check(words,w);if(!result.ok)return incorrect(result.error);
 applyPlan({moves:[w],win:result.win});
}
function applyPlan(plan){
 if(done)return;
 const dailyBonus=countDay();
 const keys=plan.moves.map(w=>[w.text,w.r,w.c,w.d].join(':'));
 const newAnswer=keys.some(k=>!credited.has(k));keys.forEach(k=>credited.add(k));
 let bonus=0;if(newAnswer){state.correctStreak++;if(state.correctStreak%3===0){state.hints++;bonus=1;}}
 words.push(...plan.moves);draft.clear();hinted.clear();
 if(plan.win)finish(bonus);else message('Correct! '+plan.moves.map(w=>w.text).join(' + ')+' accepted. '+(bonus?'Three correct in a row! You earned 1 hint.':newAnswer?state.correctStreak+' correct in a row. Keep connecting!':'Already counted toward your streak.')+(dailyBonus?' Daily streak bonus: +'+dailyBonus+' hints!':''));
 save();render();
}
function draftChanged(){
 if(!playing||done||!draft.size)return;
 message('Draft score counts new boxes. Submit answer counts every letter in each added word, including shared letters.');
}
function confetti(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;for(let i=0;i<70;i++){const el=document.createElement('i');el.className='confetto';el.style.left=Math.random()*100+'vw';el.style.background=['#efac92','#a8cfe7','#b9cda3','#e7be5c'][i%4];el.style.animationDelay=Math.random()*.7+'s';el.style.transform='rotate('+Math.random()*360+'deg)';$('confetti').append(el);setTimeout(()=>el.remove(),3700);}}
function finish(bonus=0){
 if(done)return;done=true;state.wins++;
 $('winText').textContent=pretty(activeDate)+' — connected!';$('winScore').textContent=score()+' pts';
 $('winReward').textContent=bonus?'Three correct in a row! You earned 1 hint.':'Saved to your calendar. Try an earlier puzzle or come back tomorrow.';
 message('You won! '+score()+' points. Your completed board is saved in the archive.');$('win').showModal();confetti();
}
function openDate(date){
 try{E.dateInfo(date);if(date<E.DAILY_START||date>todayKey())throw new Error('Choose an unlocked date from the archive.');
 const next=E.daily(date);save();activeDate=date;puzzle=next;
 const r=state.dailyRecords[date];words=r?.words||next.seeds.map(w=>({...w}));playing=!!r?.playing;done=!!r?.done;
 draft=new Map(r?.draft||[]);hinted=new Set(r?.hinted||[]);credited=new Set(r?.credited||[]);dir=r?.dir||'H';selected=r?.selected??112;dateWrong=r?.wrong||0;
 $('across').classList.toggle('active',dir==='H');$('down').classList.toggle('active',dir==='V');$('across').setAttribute('aria-pressed',dir==='H');$('down').setAttribute('aria-pressed',dir==='V');
 render();message(done?'Completed: '+score()+' points. Your connection is saved.':playing?'Welcome back. Your letters and score are saved.':'One date. One puzzle. Find your connection.');
 }catch(e){message(e.message,true);}
}
function start(){if(!puzzle||playing)return;playing=true;const bonus=countDay();render();message(bonus?'Daily streak bonus! You earned '+bonus+' hints.':'Click a square, choose a direction, and type your first word.');if(!storageOK)message('Browser storage is unavailable. Progress will last only for this visit.',true);}
function showArchive(){calendarMonth=activeDate.slice(0,7);renderCalendar();$('archive').showModal();}
function renderCalendar(){
 const first=new Date(calendarMonth+'-01T00:00:00Z'),year=first.getUTCFullYear(),month=first.getUTCMonth(),days=new Date(Date.UTC(year,month+1,0)).getUTCDate(),today=todayKey();
 $('calendarMonth').textContent=pretty(calendarMonth+'-01',{month:'long',year:'numeric'});
 $('prevMonth').disabled=calendarMonth<=E.DAILY_START.slice(0,7);$('nextMonth').disabled=calendarMonth>=today.slice(0,7);
 $('calendar').replaceChildren();
 for(let i=0;i<first.getUTCDay();i++){const blank=document.createElement('span');blank.setAttribute('aria-hidden','true');$('calendar').append(blank);}
 for(let n=1;n<=days;n++){
 const date=calendarMonth+'-'+String(n).padStart(2,'0'),r=state.dailyRecords[date],unlocked=date>=E.DAILY_START&&date<=today,button=document.createElement('button');
 button.className='calendar-day'+(r?.done?' completed':r?.playing?' in-progress':'')+(date===activeDate?' chosen':'');button.disabled=!unlocked;
 const status=r?.done?'✓ '+r.score+' pts':r?.playing?'◐':'—';button.textContent=n+'\n'+(unlocked?status:'Locked');
 button.setAttribute('aria-label',pretty(date)+', '+(!unlocked?'locked':r?.done?'completed, '+r.score+' points':r?.playing?'in progress':'unplayed'));
 if(date===today)button.setAttribute('aria-current','date');
 button.onclick=()=>{$('archive').close();openDate(date);};$('calendar').append(button);
 }
}
function changeMonth(amount){const d=new Date(calendarMonth+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+amount);const next=d.toISOString().slice(0,7);if(next<E.DAILY_START.slice(0,7)||next>todayKey().slice(0,7))return;calendarMonth=next;renderCalendar();}
function checkNewDay(){if(lastToday!==todayKey()){lastToday=todayKey();if(state.lastDay!==null&&day()-state.lastDay>1)state.streak=0;save();update();if($('archive').open)renderCalendar();message('A new daily puzzle is ready. Choose Today’s puzzle when you’re ready; this board is saved.');}}
$('autoNext').onclick=()=>{state.autoNext=!state.autoNext;save();update();};
$('start').onclick=start;$('next').onclick=()=>{$('win').close();showArchive();};$('closeWin').onclick=()=>$('win').close();$('streakInfo').onclick=()=>$('info').showModal();$('closeInfo').onclick=()=>$('info').close();
$('archiveButton').onclick=showArchive;$('closeArchive').onclick=()=>$('archive').close();$('todayButton').onclick=()=>openDate(todayKey());$('archiveToday').onclick=()=>{$('archive').close();openDate(todayKey());};$('prevMonth').onclick=()=>changeMonth(-1);$('nextMonth').onclick=()=>changeMonth(1);
$('across').onclick=()=>direction('H');$('down').onclick=()=>direction('V');$('clear').onclick=()=>{draft.clear();hinted.clear();render();message('A clean slate for your next word.');};$('add').onclick=submit;$('undo').onclick=()=>{if(words.length>2&&!done){words.pop();draft.clear();hinted.clear();save();render();message('Last word removed and its points returned.');}};
$('hint').onclick=()=>{if(!playing||done||state.hints<1)return;let move=puzzle.solution.find(w=>!words.some(x=>x.text===w.text&&x.r===w.r&&x.c===w.c&&x.d===w.d)&&E.check(words,w).ok);if(!move){message('Your route differs from the suggested path. Undo a word to reveal the next clue. No hint used.');return;}draft.clear();direction(move.d);const m=E.map(words);E.cells(move).forEach(p=>{let i=p.r*15+p.c;hinted.add(i);if(!m.has(i))draft.set(i,p.ch);});selected=move.r*15+move.c;state.hints--;save();render();message('Try '+move.text+' '+(move.d==='H'?'across':'down')+' at row '+(move.r+1)+', column '+(move.c+1)+'. Press Submit answer to check it.');};
openDate(todayKey());
setInterval(checkNewDay,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkNewDay();});

$('seeHowToPlay').onclick=()=>{const rules=$('howToPlay');rules.focus({preventScroll:true});rules.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});};

/* Word Links: dependency-free puzzle generation and placement rules. */
(function(root){
const common=`APPLE PEAR PLUM PEACH GRAPE MELON LEMON LIME MANGO BERRY CHERRY ORANGE BANANA OLIVE COCONUT FIG DATE KIWI FRUIT TREE LEAF ROOT SEED STEM BLOOM FLOWER GARDEN GRASS FIELD FOREST WOOD PINE OAK MAPLE CEDAR BIRCH PALM FERN MOSS ROSE LILY DAISY TULIP IRIS WATER RIVER OCEAN LAKE POND STREAM BEACH COAST SHORE SAND STONE ROCK SHELL CORAL WAVE TIDE FOAM REEF ISLAND CLOUD RAIN SNOW WIND STORM FROST HAIL MIST SUN MOON STAR SKY SPACE EARTH WORLD PLANET COMET LIGHT NIGHT DAWN DUSK SHADE SHADOW GLOW SPARK FLAME FIRE HEAT SMOKE ASH DUST AIR BIRD ROBIN EAGLE OWL DOVE CROW SWAN GOOSE DUCK HEN CHICK NEST WING FEATHER BEAK BEAR DEER FOX WOLF LION TIGER ZEBRA HORSE MOUSE RABBIT HARE OTTER BADGER CAMEL SHEEP GOAT COW PIG DOG CAT PUPPY KITTEN PAW TAIL CLAW FISH SHARK WHALE SEAL CRAB SNAIL FROG TOAD SNAKE TURTLE BEE ANT MOTH FLY WORM SPIDER BUG WILD TAME HONEY MILK CREAM BUTTER CHEESE BREAD TOAST CAKE PIE TART SUGAR SALT SPICE RICE WHEAT CORN OATS BEAN PEA SOUP STEW SAUCE PASTA NOODLE SALAD EGG FLOUR COCOA COFFEE TEA JUICE SWEET SOUR FRESH CRISP WARM COOL COLD HOT ICE MINT BASIL THYME SAGE DILL CLOVE PLATE BOWL CUP MUG GLASS SPOON FORK KNIFE TABLE CHAIR DESK BENCH COUCH BED PILLOW SHEET QUILT RUG LAMP DOOR WINDOW WALL FLOOR ROOF ROOM HOUSE HOME BRICK TILE PORCH GATE FENCE PATH ROAD STREET LANE TRAIL TRACK BRIDGE PARK TOWN CITY FARM BARN MILL SHOP STORE SCHOOL CLASS BOOK PAGE PAPER PEN PENCIL INK NOTE STORY TALE POEM VERSE RHYME WORD LETTER READ WRITE SPELL PRINT DRAW PAINT ART COLOR RED BLUE GREEN PINK GOLD SILVER WHITE BLACK BROWN PURPLE AMBER COPPER PEARL GEM RUBY OPAL JADE RING CROWN COIN MONEY GIFT PRIZE BOX BAG CASE CHEST BASKET RIBBON BOW STRING THREAD CLOTH SILK COTTON WOOL LINEN LACE DRESS SHIRT SKIRT COAT JACKET HAT CAP SHOE BOOT SOCK BELT GLOVE SCARF BUTTON ZIP POCKET WATCH CLOCK TIME HOUR MINUTE SECOND DAY WEEK MONTH YEAR SPRING SUMMER AUTUMN WINTER SEASON TODAY EARLY LATE FIRST LAST NEXT PAST YOUNG OLD NEW OPEN CLOSE START STOP BEGIN END GAME PLAY FUN JOY HAPPY SMILE LAUGH DREAM SLEEP REST PEACE QUIET CALM BRAVE KIND LOVE HEART MIND THINK LEARN KNOW IDEA PLAN HOPE WISH LUCK CHANCE CHOICE HELP SHARE GIVE TAKE FIND SEEK HIDE LOOK SEE HEAR SOUND MUSIC SONG SING VOICE TUNE PIANO DRUM FLUTE HARP DANCE STEP WALK RUN JUMP HOP SKIP SWIM FLOAT SAIL ROW RIDE DRIVE FLY TRAVEL TRIP TRAIN BOAT SHIP BIKE CAR BUS TRUCK PLANE WHEEL WAGON KITE BALL BAT NET GOAL TEAM RACE SPORT SCORE WIN LOSE DRAW TIE MATCH LINK CHAIN LINE LOOP KNOT JOIN MEET CROSS TURN BEND CURVE CIRCLE ROUND SQUARE SHAPE POINT EDGE SIDE MIDDLE CENTER NORTH SOUTH EAST WEST LEFT RIGHT HIGH LOW UP DOWN OVER UNDER ABOVE BELOW NEAR FAR LONG SHORT WIDE THIN THICK SMALL LARGE TINY GIANT DEEP FLAT STEEP SOFT HARD SMOOTH ROUGH CLEAN CLEAR BRIGHT DARK SHARP BLUNT FAST SLOW QUICK STILL TRUE FALSE REAL MAGIC SECRET PUZZLE ANSWER CLUE HINT SOLVE BUILD MAKE CREATE FIX MEND GROW PLANT PICK CARRY LIFT PUSH PULL HOLD KEEP SAVE SPEND COUNT NUMBER THREE FOUR FIVE SIX SEVEN EIGHT NINE TEN ONE TWO`.split(' ');
function cells(w){return [...w.text].map((ch,i)=>({r:w.r+(w.d==='V'?i:0),c:w.c+(w.d==='H'?i:0),ch}));}
function map(words){const m=new Map();words.forEach((w,id)=>cells(w).forEach(p=>{const k=p.r*15+p.c; if(!m.has(k))m.set(k,{ch:p.ch,ids:[]});m.get(k).ids.push(id)}));return m;}
function components(words){const parent=words.map((_,i)=>i);const find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));map(words).forEach(p=>p.ids.slice(1).forEach(i=>parent[find(i)]=find(p.ids[0])));return words.map((_,i)=>find(i));}
function check(words,w,finalAllowed=true){
 const cs=cells(w),m=map(words),touch=new Set();
 if(w.text.length<2||w.text.length>15)return {error:'Use a word with 2–15 letters.'};
 if(cs.some(p=>p.r<0||p.r>14||p.c<0||p.c>14))return {error:'That word goes past the edge of the grid.'};
 let fresh=0;
 for(const p of cs){const q=m.get(p.r*15+p.c);if(q){if(q.ch!==p.ch)return {error:'The crossing letters need to match.'};for(const id of q.ids){if(words[id].d===w.d)return {error:'Words must cross, rather than overlap along a row or column.'};touch.add(id)}}else{fresh++;for(const delta of [-1,1]){const r=p.r+(w.d==='H'?delta:0),c=p.c+(w.d==='V'?delta:0);if(r>=0&&r<15&&c>=0&&c<15&&m.has(r*15+c))return {error:'Leave a square between words except at a crossing.'};}}}
 if(!fresh)return {error:'Add at least one new letter.'};
 const first=cs[0],last=cs[cs.length-1];for(const p of [{r:first.r-(w.d==='V'?1:0),c:first.c-(w.d==='H'?1:0)},{r:last.r+(w.d==='V'?1:0),c:last.c+(w.d==='H'?1:0)}])if(p.r>=0&&p.r<15&&p.c>=0&&p.c<15&&m.has(p.r*15+p.c))return {error:'Leave an empty square before and after your word.'};
 if(touch.size===1)return {ok:true,win:false};
 if(touch.size===2&&finalAllowed){const comp=components(words),ids=[...touch];if(comp[ids[0]]!==comp[ids[1]]&&new Set(ids.map(i=>comp[i])).has(comp[0])&&new Set(ids.map(i=>comp[i])).has(comp[1]))return {ok:true,win:true};}
 return {error:touch.size===0?'Cross one existing word at a matching letter.':'Cross exactly one word—or one from each chain to finish.'};
}
function shuffled(a,rng){return a.map(x=>[rng(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);}
function generate(level,seen=new Set(),rng=Math.random){
 const steps=2+Math.floor((level-1)*.67), pool=common.filter(w=>w.length>=3&&w.length<=Math.min(9,5+Math.floor(level/3)));
 for(let attempt=0;attempt<1600;attempt++){
 const first=pool[Math.floor(rng()*pool.length)],words=[{text:first,r:4+Math.floor(rng()*7),c:3+Math.floor(rng()*4),d:'H'}];
 for(let k=0;k<steps+1;k++){
 const prev=words[words.length-1],options=[];
 for(const text of shuffled(pool,rng)){
 if(words.some(w=>w.text===text))continue;
 for(let a=0;a<prev.text.length;a++)for(let b=0;b<text.length;b++)if(prev.text[a]===text[b]){
 const d=prev.d==='H'?'V':'H',r=prev.r+(prev.d==='V'?a:0)-(d==='V'?b:0),c=prev.c+(prev.d==='H'?a:0)-(d==='H'?b:0),w={text,r,c,d};
 if(check(words,w,false).ok)options.push(w);
 }
 if(options.length>24)break;
 }
 if(!options.length)break; words.push(options[Math.floor(rng()*options.length)]);
 }
 if(words.length!==steps+2)continue;
 const seeds=[words[0],words[words.length-1]],solution=words.slice(1,-1),dist=Math.abs(seeds[0].r-seeds[1].r)+Math.abs(seeds[0].c-seeds[1].c);
 if(dist<Math.min(9,level+2))continue;
 // Recheck the exact order the player will see, with both starting words present.
 const board=seeds.slice();let valid=true;for(let i=0;i<solution.length;i++){const result=check(board,solution[i]);if(!result.ok||result.win!==(i===solution.length-1)){valid=false;break;}board.push(solution[i]);}if(!valid)continue;
 const id=JSON.stringify(seeds);if(seen.has(id))continue;return {id,seeds,solution,level};
 }
 throw new Error('Could not find a fresh puzzle. Please try again.');
}
// Interpret pending letters as whole crossing words, without committing incomplete prefixes.
function planDraft(words,draft,dictionary){
 if(!draft.size)return null;
 const occupied=map(words),candidates=[];
 for(const [i,ch] of draft)occupied.set(i,{ch});
 for(const d of ['H','V'])for(let r=0;r<15;r++)for(let c=0;c<15;c++){
  const start=r*15+c,step=d==='H'?1:15;
  if(!occupied.has(start)||(d==='H'?c>0:r>0)&&occupied.has(start-step))continue;
  let text='',ids=[];
  for(let rr=r,cc=c;rr<15&&cc<15;rr+=d==='V'?1:0,cc+=d==='H'?1:0){
   const i=rr*15+cc;if(!occupied.has(i))break;text+=occupied.get(i).ch;if(draft.has(i))ids.push(i);
  }
  if(text.length>=2&&ids.length&&dictionary.has(text))candidates.push({word:{text,r,c,d},ids});
 }
 if([...draft.keys()].some(i=>!candidates.some(w=>w.ids.includes(i))))return null;
 const visited=new Set();let budget=2000;
 function search(board,remaining,covered,moves){
  if(--budget<0)return null;
  const key=remaining.join(',');if(visited.has(key))return null;visited.add(key);
  for(const index of remaining){
   const {word,ids}=candidates[index],result=check(board,word);if(!result.ok)continue;
   const nextCovered=new Set([...covered,...ids]),nextMoves=[...moves,word];
   if(nextCovered.size===draft.size)return {moves:nextMoves,win:result.win};
   if(result.win)continue;
   const found=search([...board,word],remaining.filter(i=>i!==index),nextCovered,nextMoves);if(found)return found;
  }
  return null;
 }
 return search(words,candidates.map((_,i)=>i),new Set(),[]);
}
// Daily v1: frozen vocabulary/order and UTC ISO dates make the board device-independent.
const DAILY_START='2026-01-01';
function dateInfo(date){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('Choose a valid calendar date.');
 const d=new Date(date+'T00:00:00Z');
 if(!Number.isFinite(d.getTime())||d.toISOString().slice(0,10)!==date)throw new Error('Choose a valid calendar date.');
 const weekday=d.getUTCDay();return {weekday,level:[1,3,4,6,7,9,10][weekday],label:['Gentle','Easy','Moderate','Thoughtful','Tricky','Challenging','Expert'][weekday]};
}
function daily(date){
 const info=dateInfo(date);let hash=2166136261;
 for(const ch of 'word-links-daily-v1:'+date)hash=Math.imul(hash^ch.charCodeAt(0),16777619)>>>0;
 const rng=()=>{hash=(hash+0x6D2B79F5)>>>0;let t=hash;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
 return {...generate(info.level,new Set(),rng),date,...info};
}
root.WL={common,cells,map,components,check,generate,planDraft,daily,dateInfo,DAILY_START};if(typeof module!=='undefined')module.exports=root.WL;
})(typeof window==='undefined'?globalThis:window);

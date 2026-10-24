// 사례형 문항은행 검사기 — node tools/validate_case.js [case_bank.js]
// 실패 시 종료코드 1. 고의 위반 대조군(selftest)이 먼저 걸려야 본 검사가 유효하다.
const fs = require('fs'), vm = require('vm');
const SUBJ = ['글로벌기준','국내제도','위험과 방법','위험평가','CDD','CTR·STR'];
const TYPES = ['basic','blank','combo','count','case'];
function load(file){ const ctx={window:{}}; vm.runInNewContext(fs.readFileSync(file,'utf8'),ctx); return ctx.window.CASE_BANK; }
function check(bank, bankIdsOfBase){
  const errs=[]; const seen=new Set();
  if(!Array.isArray(bank)||!bank.length){ errs.push('CASE_BANK 비었거나 배열 아님'); return errs; }
  bank.forEach((q,i)=>{
    const w=m=>errs.push(`${q&&q.id||('#'+i)}: ${m}`);
    if(!/^CS\d{3}$/.test(q.id)) w('id 형식(CS000)');
    if(seen.has(q.id)) w('id 중복'); seen.add(q.id);
    if(bankIdsOfBase && bankIdsOfBase.has(q.id)) w('기존 BANK id와 충돌');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(q.date||'')) w('date 형식');
    if(!SUBJ.includes(q.subject)) w('subject 미허용: '+q.subject);
    if(!TYPES.includes(q.t)) w('t 미허용: '+q.t);
    if(![5,10,15].includes(q.p)) w('p는 5/10/15');
    if(!q.scene||q.scene.length<60) w('scene 너무 짧음(사례형은 장문)');
    if(!q.ask) w('ask 없음');
    if(!Array.isArray(q.ch)||q.ch.length!==5) w('선지 5개 아님');
    else if(new Set(q.ch).size!==5) w('선지 중복');
    if(!(Number.isInteger(q.a)&&q.a>=0&&q.a<5)) w('정답 인덱스 범위');
    if(!q.ex||!q.ex.startsWith('정답')) w('ex는 「정답」으로 시작');
    if(!q.src||q.src.length<8) w('src(근거) 없음');
    if(!Array.isArray(q.items)) w('items 배열 아님');
    const lab=['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ','ㅅ'];
    (q.items||[]).forEach((t,k)=>{ if(!t.startsWith(lab[k]+'.')) w(`items[${k}] 표지(${lab[k]}.) 불일치`); });
    if((q.t==='count'||q.t==='combo') && (q.items||[]).length<4) w('개수형·조합형은 보기 4개 이상');
    if(q.t==='count'){ const n=q.ch.map(c=>parseInt(c)); if(n.join()!=='1,2,3,4,5') w('개수형 선지는 1개~5개'); }
    if(q.t==='count'||q.t==='combo'){ // 해설에 보기별 판정이 다 있는지
      (q.items||[]).forEach((t,k)=>{ if(!new RegExp(lab[k]+'\\s*[○✕]').test(q.ex)) w(`해설에 ${lab[k]} 판정(○/✕) 없음`); });
    }
    if(q.t==='count'){ const o=(q.items||[]).filter((t,k)=>new RegExp(lab[k]+'\\s*○').test(q.ex)).length; if(o!==q.a+1) w(`개수형 정답(${q.a+1}개)과 해설 ○ 수(${o}) 불일치`); }
    if(q.t==='combo'){ const o=(q.items||[]).map((t,k)=>new RegExp(lab[k]+'\\s*○').test(q.ex)?lab[k]:null).filter(Boolean).join(', '); if(q.ch[q.a].replace(/\s/g,'')!==o.replace(/\s/g,'')) w(`조합형 정답(${q.ch[q.a]})과 해설 ○(${o}) 불일치`); }
    if(typeof q.rv!=='boolean') w('rv(검토 여부) boolean 아님');
  });
  return errs;
}
// 대조군: 반드시 걸려야 하는 표본
const bad=[{id:'CS1',date:'x',subject:'기타',t:'zz',p:7,scene:'짧음',ask:'',ch:['1개','1개'],a:9,ex:'해설',src:'',items:['가.'],rv:1},
  {id:'CS998',date:'2026-01-01',subject:'CDD',t:'count',p:15,scene:'가'.repeat(80),ask:'몇 개?',items:['ㄱ. a','ㄴ. b','ㄷ. c','ㄹ. d'],ch:['1개','2개','3개','4개','5개'],a:2,ex:'정답 ㄱ ○ ㄴ ✕ ㄷ ✕ ㄹ ✕',src:'특금법 제4조',rv:false}];
const ctl=check(bad);
if(ctl.length<10 || !ctl.some(e=>e.includes('개수형 정답'))){ console.error('대조군 미검출 — 검사기 고장', ctl); process.exit(2); }
const file=process.argv[2]||'case_bank.js';
const bank=load(file);
let baseIds=null;
try{ const h=fs.readFileSync('index.html','utf8'); baseIds=new Set([...h.matchAll(/["']?id["']?\s*:\s*["']([A-Z]{1,3}\d+)["']/g)].map(m=>m[1]).filter(x=>!x.startsWith('CS'))); }catch(e){}
const errs=check(bank,baseIds);
const bySubj={}; bank.forEach(q=>bySubj[q.subject]=(bySubj[q.subject]||0)+1);
const pos=[0,0,0,0,0]; bank.forEach(q=>pos[q.a]++);
console.log(`대조군 검출 ${ctl.length}건(정상) / 검사 대상 ${bank.length}문항`);
console.log('영역별', JSON.stringify(bySubj), '/ 정답 위치', pos.join(','));
if(errs.length){ console.error('FAIL\n'+errs.join('\n')); process.exit(1); }
console.log('PASS');

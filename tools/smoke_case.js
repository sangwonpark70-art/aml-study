// 앱 실행 점검 — npm i jsdom 후 node tools/smoke_case.js
// 기존 211문항 불변, 사례형 탭 렌더, 전 문항 풀이·채점·기록, 콘솔 오류 0
const fs=require('fs'); const {JSDOM,VirtualConsole}=require('jsdom');
let html=fs.readFileSync('index.html','utf8');
const cb=fs.readFileSync('case_bank.js','utf8');
html=html.replace('<script src="case_bank.js"></script>','<script>'+cb+'</script>');
const errs=[]; const vc=new VirtualConsole(); vc.on('error',e=>errs.push(String(e))); vc.on('jsdomError',e=>errs.push(String(e.message||e)));
const dom=new JSDOM(html,{url:'https://sangwonpark70-art.github.io/aml-study/',runScripts:'dangerously',virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){w.__t=1790000000000;w.Date.now=()=>w.__t;}});
const w=dom.window, ev=c=>w.eval(c); const R=[]; const T=(n,c,i)=>R.push([c?'PASS':'FAIL',n,i===undefined?'':i]);
T('BANK.length=211',ev('BANK.length')===211,ev('BANK.length'));
const n=ev('CASE_BANK.length'); T('CASE_BANK 로드',n>0,n);
w.document.querySelector('.tabbtn[data-tab="case"]').click();
T('목록 행수=문항수',w.document.querySelectorAll('#tab-case .caserow').length===n);
ev("startCase('all')");
let ok=0;
for(let i=0;i<n;i++){ const q=ev('caseSession.questions[caseSession.index]'); w.__t+=60000; ev(`selectCase('${q.id}',${q.a})`);
  if(!w.document.querySelector('#tab-case .caseex')) T('해설 표시 '+q.id,false); ok++; ev('nextCase()'); }
const st=JSON.parse(ev('JSON.stringify(caseStats())'));
T('전 문항 정답 기록',st.firstOk===n&&st.firsts===n,JSON.stringify(st));
T('기존 기록 불변',ev('appState.history.length===0&&Object.keys(appState.wrongNotes).length===0'));
T('콘솔 오류 0',errs.length===0,errs.join('|'));
R.forEach(r=>console.log(r[0],r[1],r[0]==='FAIL'?r[2]:''));
const f=R.filter(r=>r[0]==='FAIL').length; console.log(`${R.length-f} PASS / ${f} FAIL`); process.exit(f?1:0);

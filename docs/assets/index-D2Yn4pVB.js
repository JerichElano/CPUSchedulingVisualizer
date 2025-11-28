(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))i(e);new MutationObserver(e=>{for(const r of e)if(r.type==="childList")for(const a of r.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function n(e){const r={};return e.integrity&&(r.integrity=e.integrity),e.referrerPolicy&&(r.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?r.credentials="include":e.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(e){if(e.ep)return;e.ep=!0;const r=n(e);fetch(e.href,r)}})();class h extends Error{}const T=o=>{if(!Array.isArray(o)||!o.length)throw new h("Provide at least one process.");const t=[],n=new Set;return o.forEach((i,e)=>{const r=(i.job??`P${e+1}`).trim()||`P${e+1}`;if(n.has(r))throw new h(`Duplicate job '${r}'.`);n.add(r);const a=Number(i.arrival),c=Number(i.burst),s=Number(i.priority);if(Number.isNaN(a)||Number.isNaN(c)||Number.isNaN(s)||!Number.isFinite(a)||!Number.isFinite(c)||!Number.isFinite(s))throw new h(`Arrival, burst, and priority must be numbers for '${r}'.`);if(a<0||c<=0)throw new h(`Arrival must be >= 0 and burst > 0 for '${r}'.`);t.push({job:r,arrival:Math.floor(a),burst:Math.floor(c),priority:Math.floor(s)})}),t},A=o=>{const t=T(o),n=t.length,i=new Set;let e=Math.min(...t.map(s=>s.arrival));const r=[],a=[];for(;i.size<n;){const s=t.map((d,u)=>({proc:d,idx:u})).filter(({idx:d,proc:u})=>!i.has(d)&&u.arrival<=e);if(!s.length){const d=Math.min(...t.filter((u,p)=>!i.has(p)).map(u=>u.arrival));e=Math.max(e,d);continue}const l=s.reduce((d,u)=>{const p=[d.proc.priority,d.proc.burst,d.proc.arrival],g=[u.proc.priority,u.proc.burst,u.proc.arrival];for(let m=0;m<p.length;m+=1)if(g[m]!==p[m])return g[m]<p[m]?u:d;return d}),v=e-l.proc.arrival,$=v+l.proc.burst,y=e+l.proc.burst;r.push({...l.proc,waiting:v,turnaround:$,completion:y}),a.push({job:l.proc.job,start:e,end:y}),e=y,i.add(l.idx)}const c=r.reduce((s,l)=>(s.waiting+=l.waiting,s.turnaround+=l.turnaround,s),{waiting:0,turnaround:0});return{processes:t.map(s=>r.find(l=>l.job===s.job)),timeline:a,averages:{waiting:Number((c.waiting/n).toFixed(2)),turnaround:Number((c.turnaround/n).toFixed(2))}}},E=document.getElementById("app");if(!E)throw new Error("Missing #app element.");E.innerHTML=`
  <main class="app">
    <section class="panel">
      <header>
        <h1>Non-Preemptive Priority Scheduler</h1>
        <p>Simulate CPU process scheduling entirely in your browser.</p>
      </header>

      <div class="controls">
        <button type="button" id="addRow">+ Add Process</button>
        <button type="button" id="resetRows">Reset</button>
      </div>

      <form id="processForm">
        <table class="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Arrival</th>
              <th>Burst</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="processBody"></tbody>
        </table>

        <div class="form-actions">
          <button type="submit" class="primary">Run Simulation</button>
        </div>
      </form>
    </section>

    <section class="panel" id="resultsPanel" hidden>
      <header>
        <h2>Results</h2>
        <div id="stats"></div>
      </header>

      <table class="table" id="resultsTable">
        <thead>
          <tr>
            <th>Job</th>
            <th>Arrival</th>
            <th>Burst</th>
            <th>Priority</th>
            <th>Completion</th>
            <th>Turnaround</th>
            <th>Waiting</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>

      <div>
        <h3>Timeline</h3>
        <div id="timeline" class="timeline"></div>
      </div>
    </section>

    <template id="rowTemplate">
      <tr>
        <td><input name="job" type="text" maxlength="3" required /></td>
        <td><input name="arrival" type="number" min="0" value="0" required /></td>
        <td><input name="burst" type="number" min="1" value="1" required /></td>
        <td><input name="priority" type="number" min="0" value="0" required /></td>
        <td>
          <button type="button" class="icon removeRow" aria-label="Remove row">×</button>
        </td>
      </tr>
    </template>
  </main>
`;const b=document.getElementById("processBody"),B=document.getElementById("rowTemplate"),S=document.getElementById("processForm"),L=document.getElementById("resultsPanel"),w=document.querySelector("#resultsTable tbody"),M=document.getElementById("stats"),f=document.getElementById("timeline"),R=document.getElementById("addRow"),j=document.getElementById("resetRows"),N=(o="")=>{var r;const t=(r=B.content.firstElementChild)==null?void 0:r.cloneNode(!0);if(!t)throw new Error("Cannot clone process row template.");const n=t.querySelectorAll("input"),[i]=n;i.value=o,i.placeholder=o||"Job";const e=t.querySelector(".removeRow");e==null||e.addEventListener("click",()=>{b.children.length>1&&t.remove()}),b.appendChild(t)},P=(o=3)=>{b.innerHTML="";for(let t=0;t<o;t+=1){const n=String.fromCharCode(65+t);N(n)}},x=()=>Array.from(b.querySelectorAll("tr")).map((t,n)=>{const i=Object.fromEntries(Array.from(t.querySelectorAll("input")).map(e=>[e.name,e.value.trim()]));return{job:i.job||`P${n+1}`,arrival:Number(i.arrival),burst:Number(i.burst),priority:Number(i.priority)}}),C=o=>{if(L.hidden=!1,M.textContent=`Average Waiting: ${o.averages.waiting} | Average Turnaround: ${o.averages.turnaround}`,w.innerHTML="",o.processes.forEach(t=>{const n=document.createElement("tr");n.innerHTML=`
      <td>${t.job}</td>
      <td>${t.arrival}</td>
      <td>${t.burst}</td>
      <td>${t.priority}</td>
      <td>${t.completion}</td>
      <td>${t.turnaround}</td>
      <td>${t.waiting}</td>
    `,w.appendChild(n)}),f.innerHTML="",!o.timeline.length){f.innerHTML="<p>Timeline unavailable.</p>";return}o.timeline.forEach(t=>{const n=document.createElement("div");n.className="timeline-segment",n.style.flex=String(t.end-t.start),n.innerHTML=`
      ${t.job}
      <span>${t.start} → ${t.end}</span>
    `,f.appendChild(n)})},I=o=>{o.preventDefault();try{const t=A(x());C(t)}catch(t){const n=t instanceof h||t instanceof Error?t.message:"Simulation failed. Please try again.";alert(n)}};R.addEventListener("click",()=>{const o=b.children.length,t=String.fromCharCode(65+o);N(t)});j.addEventListener("click",()=>P());S.addEventListener("submit",I);P();

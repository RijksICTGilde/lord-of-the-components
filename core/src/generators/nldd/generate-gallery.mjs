import { readFileSync, writeFileSync } from "node:fs";
const CEM = JSON.parse(readFileSync("node_modules/@nldd/design-system/custom-elements.json","utf8"));
const FRAG = JSON.parse(readFileSync("packages/lotc-nldd/src/lotc_nldd/registry.json","utf8"));
const genNames = new Set(FRAG.components.map(c=>c.name));

// index CEM by tag
const byTag = {};
for (const mod of CEM.modules||[]) for (const d of mod.declarations||[]) if (d.customElement&&d.tagName) byTag[d.tagName]={...d,_group:(mod.path||"").split("/").filter(s=>s&&s!=="src"&&s!=="components")[0]||"content"};

function example(cname){
  const el = byTag["nldd-"+cname]; if(!el) return `<c-${cname}/>`;
  const attrs=[];
  for(const a of (el.attributes||[])){
    const n=a.name, t=(a.type?.text||"").trim();
    if(t==="boolean"){ continue; } // laat booleans meestal weg
    let v;
    if(/^(text|label|name|title|heading|summary|value|placeholder|caption|message)$/.test(n)) v="Voorbeeld";
    else if(/(src|srcset|href|url|action)/.test(n)) v="#";
    else if(n==="icon") v="info";
    else if(n==="initials") v="AS";
    else if(n==="size") v="md";
    else if(n==="type"||n==="variant"||n==="color"||n==="status"||n==="tone"||n==="direction"||n==="align") continue; // enum: overslaan (onbekende waardes)
    else v=n; // fallback: attribuutnaam als waarde
    attrs.push(`${n}="${v}"`);
  }
  const content = (el.slots||[]).some(s=>!s.name) ? "Voorbeeld" : "";
  const a = attrs.length? " "+attrs.slice(0,4).join(" ") : "";
  return `<c-${cname}${a}>${content}</c-${cname}>`;
}

// groepeer per categorie
const groups={};
for(const c of FRAG.components){ (groups[c.category]=groups[c.category]||[]).push(c.name); }
let body="";
for(const [cat,names] of Object.entries(groups)){
  body+=`\n  <h2>${cat}</h2>\n`;
  for(const n of names.sort()){
    body+=`  <div class="cell"><code>c-${n}</code><div class="demo">${example(n)}</div></div>\n`;
  }
}
const html=`<c-page title="NLDD component gallery" theme="nldd" design-systems="nldd">
<style>
  body{font-family:system-ui;padding:1rem}
  h2{margin:1.5rem 0 .5rem;color:#154273;text-transform:uppercase;font-size:.8rem;border-top:1px solid #ddd;padding-top:1rem}
  .cell{display:inline-block;vertical-align:top;margin:.4rem;padding:.5rem;border:1px solid #eee;border-radius:6px;min-width:160px;max-width:280px}
  .cell code{font-size:.7rem;color:#888;display:block;margin-bottom:.35rem}
  .demo{min-height:1.5rem}
</style>
<h1>NLDD gallery — ${FRAG.components.length} gegenereerde componenten</h1>
${body}
</c-page>`;
writeFileSync("tests/visual/fixtures/nldd-gallery.html", html);
console.log("wrote nldd-gallery.html:", FRAG.components.length, "components");

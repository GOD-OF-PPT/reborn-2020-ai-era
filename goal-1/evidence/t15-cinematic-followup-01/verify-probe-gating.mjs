import {readFileSync} from 'node:fs';
import {runInNewContext, Script} from 'node:vm';
const script=readFileSync('public/diagnostics/startup-metrics-v1.js','utf8');new Script(script);
const cases=[['127.0.0.1',''],['localhost','?performanceTest=other'],['[::1]',''],['example.com','?performanceTest=startup-v1'],['127.0.0.1.example.com','?performanceTest=startup-v1'],['localhost.example.com','?performanceTest=startup-v1']];
for(const [hostname,search] of cases)runInNewContext(script,{location:{hostname,search},URLSearchParams},{timeout:1000});
const html=readFileSync('index.html','utf8');const inline=html.match(/<script>([\s\S]*?)<\/script>/)[1];
for(const [hostname,search] of cases)runInNewContext(inline,{location:{hostname,search},URLSearchParams},{timeout:1000});
console.log(JSON.stringify({result:'INACTIVE_PROBE_HAS_NO_DOM_PERFORMANCE_CONSOLE_OR_STORAGE_ACCESS',cases:cases.length,paths:2,scope:'Opt-out/local-origin gates only; active browser path requires native evidence'}));

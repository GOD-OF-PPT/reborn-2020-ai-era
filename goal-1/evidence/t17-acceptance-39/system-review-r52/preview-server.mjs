import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';

// Local design artifact only. The game and private save exports are not served.
const base='goal-1/evidence/t17-acceptance-39/system-review-r52';
const routes=new Map([
 ['/',[base+'/storyboard.html','text/html; charset=utf-8']],
 ['/storyboard.html',[base+'/storyboard.html','text/html; charset=utf-8']],
 ['/decision.md',[base+'/decision.md','text/plain; charset=utf-8']],
 ['/assets/ui-redesign/cinematic/room-ordinary-v1.jpg',['assets/ui-redesign/cinematic/room-ordinary-v1.jpg','image/jpeg']],
]);
const server=createServer(async(req,res)=>{
 const path=new URL(req.url,'http://127.0.0.1:5402').pathname;
 const row=routes.get(path);
 if(!['GET','HEAD'].includes(req.method)||!row){res.writeHead(404);res.end('Not found');return;}
 try{
  const data=await readFile(resolve(row[0]));
  res.writeHead(200,{'Content-Type':row[1],'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(500);res.end('Design artifact unavailable');}
});
server.listen(5402,'127.0.0.1',()=>console.log('Design artifact: http://127.0.0.1:5402/storyboard.html'));
server.on('error',error=>{console.error(error.message);process.exitCode=1;});

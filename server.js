const http=require('http'),fs=require('fs'),path=require('path');
const root=__dirname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=http.createServer((req,res)=>{let pathname=decodeURIComponent((req.url||'/').split('?')[0]);let file=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');let full=path.resolve(root,file);if(!full.startsWith(root+path.sep)&&full!==root){res.writeHead(403);return res.end('Forbidden')}fs.readFile(full,(err,data)=>{if(err){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':types[path.extname(full)]||'application/octet-stream'});res.end(data)})});
const port=process.env.PORT||3000;server.listen(port,'0.0.0.0',()=>console.log(`Retro Football vs Bot running on ${port}`));

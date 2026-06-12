const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DIST = path.join(__dirname, 'dist');

const DIST = path.join(__dirname, 'dist');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
};

// 尝试启动服务器，端口被占用时自动切换
const startServer = (port) => {
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(404);
        res.end('404 Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️  端口 ${port} 已被占用，尝试端口 ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('服务器错误:', err);
    }
    return;
  });

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`✅ 服务器已启动: ${url}`);
    console.log('   按 Ctrl+C 停止服务器');
    
    // 自动打开浏览器（跨平台）
    setTimeout(() => {
      const platform = process.platform;
      let command;
      
      if (platform === 'win32') {
        command = `start "" "${url}"`;
      } else if (platform === 'darwin') {
        command = `open "${url}"`;
      } else {
        // Linux / Raspberry Pi
        // 优先尝试 chromium-browser（树莓派），然后是 xdg-open（通用）
        command = `chromium-browser --new-window "${url}" 2>/dev/null || chromium --new-window "${url}" 2>/dev/null || xdg-open "${url}" 2>/dev/null || echo "请手动打开浏览器访问: ${url}"`;
      }
      
      exec(command, (err) => {
        if (err) {
          console.log('请手动打开浏览器访问:', url);
        }
      });
    }, 500);
  });
};

// 从命令行参数读取端口，默认 8899
const PORT = parseInt(process.argv[2]) || 8899;
startServer(PORT);

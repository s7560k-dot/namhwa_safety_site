import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 설정: 버전 코드는 현재 시각(ms)을 사용하여 중복 방지
const version = Date.now();
const distDir = path.resolve(__dirname, '../dist');

function getAllHtmlFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllHtmlFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            if (file.endsWith(".html")) {
                arrayOfFiles.push(path.join(dirPath, "/", file));
            }
        }
    });

    return arrayOfFiles;
}

try {
    console.log(`[Version Bump] Starting versioning with ID: ${version}`);
    const htmlFiles = getAllHtmlFiles(distDir);

    htmlFiles.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');

        // 1. 내부 JS 참조 버전 주입 (src="/...js" 또는 src="../...js")
        // 정규식 설명: src="로 시작하고 .js"로 끝나는 경로 중 이미 쿼리스트링이 없는 것들 대상
        const scriptRegex = /(src="\/[^"]+\.js|src="\.\.\/[^"]+\.js)(?!\?v=)/g;
        const newContent = content.replace(scriptRegex, `$1?v=${version}`);

        if (content !== newContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`[Version Bump] Updated: ${path.relative(distDir, file)}`);
        }
    });

    console.log('[Version Bump] Completed successfully.');
} catch (error) {
    console.error('[Version Bump] Error:', error);
    process.exit(1);
}

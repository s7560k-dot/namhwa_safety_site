import os
import re

# 정적 파일 목록 (상대 경로)
static_files = [
    'AHA/index.html',
    'OUT/index.html',
    'PTW/index.html',
    'System/index.html',
    'WSHCC/index.html',
    'daily_arch/index.html',
    'daily_ce/index.html',
    'pre_check/index.html',
    'sh_check/index.html',
    'shm_system/index.html',
    'status_a/index.html',
    'work/index.html'
]

base_path = 'd:/Antigravity/my-safety-app/frontend/public'
script_tag = '<script src="/auth-guard.js"></script>'

for file_rel_path in static_files:
    file_path = os.path.join(base_path, file_rel_path)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 이미 주입되어 있는지 확인
        if 'auth-guard.js' in content:
            print(f"Skipping {file_rel_path}: Already protected.")
            continue
            
        # <head> 태그 바로 뒤에 주입
        new_content = content.replace('<head>', f'<head>\n    {script_tag}')
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Protected {file_rel_path}")
    else:
        print(f"Warning: {file_rel_path} not found.")

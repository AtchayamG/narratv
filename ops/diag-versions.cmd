@echo off
cd /d "D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv"
echo === root react ===
findstr /c:"\"version\"" node_modules\react\package.json
echo === root react-native ===
findstr /c:"\"version\"" /c:"\"name\"" node_modules\react-native\package.json
echo === app-local react ===
if exist apps\firetv\node_modules\react\package.json (findstr /c:"\"version\"" apps\firetv\node_modules\react\package.json) else (echo none)
echo === app-local react-native ===
if exist apps\firetv\node_modules\react-native\package.json (findstr /c:"\"version\"" /c:"\"name\"" apps\firetv\node_modules\react-native\package.json) else (echo none)
echo === app-local react-test-renderer ===
if exist apps\firetv\node_modules\react-test-renderer\package.json (findstr /c:"\"version\"" apps\firetv\node_modules\react-test-renderer\package.json) else (echo none)
echo === root react-test-renderer ===
if exist node_modules\react-test-renderer\package.json (findstr /c:"\"version\"" node_modules\react-test-renderer\package.json) else (echo none)
echo === app package.json deps ===
findstr /c:"\"react" /c:"expo\"" /c:"tvos" apps\firetv\package.json
echo === who depends on react 18 ===
yarn.cmd why react 2>&1 | findstr /i "react@ depends" 

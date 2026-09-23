@echo off
REM Whole-workspace test run. NODE_ENV pinned - see ops/test.cmd for why.
REM
REM Runs from wherever the repository was cloned: the path is taken from this
REM script's own location. It used to be hardcoded to the author's machine.
REM
REM Builds the two shared workspace packages first. The app and the pipeline
REM import @narratv/contracts and @narratv/scheduler through their package
REM "main" (dist/index.js), and dist/ is a build output that is not committed.
REM On a fresh clone it does not exist, and before this step every app suite
REM that touches the scheduler failed with "Cannot find module
REM '@narratv/scheduler'" - which only never showed up because the author's
REM own checkout already had dist/ from an earlier build.
setlocal
set "NODE_ENV=test"
cd /d "%~dp0.."
call yarn workspace @narratv/contracts build || exit /b 1
call yarn workspace @narratv/scheduler build || exit /b 1
call yarn test 2>&1

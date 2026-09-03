@echo off
REM Run the Jest suites for the Fire TV app.
REM
REM NODE_ENV is pinned to "test" here on purpose. This machine has
REM NODE_ENV=production set in the user environment; with that inherited,
REM react-test-renderer loads its PRODUCTION build and every
REM @testing-library/react-native render() throws
REM "Can't access .root on unmounted test renderer".
REM That is an environment fault, not a code fault - do not "fix" it in tests.
set "NODE_ENV=test"
set "P=D:\Work\Codex\Hackathon Projects\Amazon Developer Hackathon\projects\01-firetv-narratv"
cd /d "%P%\apps\firetv"
npx jest %* 2>&1

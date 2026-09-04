@echo off
npm run dev > dev-out.log 2> dev-err.log
echo EXITCODE %ERRORLEVEL% at %DATE% %TIME% >> dev-exit.log

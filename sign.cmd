@echo off
echo Ready to sign firefox XPI...
pause
call gulp
pushd .\dist\ext_firefox
call web-ext sign --api-key %AMO_USER% --api-secret %AMO_SECRET%
popd
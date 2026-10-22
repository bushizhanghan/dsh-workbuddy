@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 发布 @bushizhanghan/dsh-workmate

echo ============================================
echo  发布 @bushizhanghan/dsh-workmate 到 npm
echo  目录: %CD%
echo ============================================
echo.

echo [1/3] 当前 npm 账号：
call npm whoami
echo.
echo       如果不是 bushizhanghan：先 npm login，或 npm logout 再登录。
echo.

echo [2/3] 进行发布。
echo       npm 会提示输入 one-time password，
echo       这时去验证器 App 抄 npm 那一条的 6 位数粘进来回车。
echo ------------------------------------------------------------------
call npm publish --access public --ignore-scripts
set "RC=%errorlevel%"
echo ------------------------------------------------------------------

if not "%RC%"=="0" goto fail

echo.
echo [3/3] 校验线上版本：
call npm view @bushizhanghan/dsh-workmate version

echo.
echo ============================================
echo  发布成功
echo  页面: https://www.npmjs.com/package/@bushizhanghan/dsh-workmate
echo  把这个版本号发我，我去提 awesome-dsh-plugin 的 PR
echo ============================================
pause
exit /b 0

:fail
echo.
echo ============================================
echo  发布失败（退出码 %RC%），对号入座：
echo   E403 + Two-factor  = 账号没开 2FA，或验证码不对
echo   EOTP               = 验证码过期，重跑本脚本再输一次
echo   E409               = 1.2.0 被占了，先把 package.json 版本提到 1.2.1
echo   ENEEDAUTH          = 掉登录了，npm login 之后再来
echo  其他情况：把上面整段红字复制给我
echo ============================================
pause
exit /b 1

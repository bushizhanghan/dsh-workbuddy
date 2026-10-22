@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ============================================
echo  发布 @bushizhanghan/dsh-workmate 到 npm
echo  目录: %CD%
echo ============================================
echo.

call npm whoami >nul 2>&1
if errorlevel 1 goto login

call npm whoami
echo.
echo 已登录。若上面不是 bushizhanghan，请先 npm logout 再重新登录。
echo.
goto otp

:login
echo 未登录，正在打开浏览器登录...
call npm login
if errorlevel 1 goto fail
echo.
call npm whoami
echo.

:otp
echo --------------------------------------------
echo 账号开了 2FA，发布必须带一次性验证码。
echo 先打开验证器 App，再输入下面这 6 位数（30 秒内有效）。
echo --------------------------------------------
set "OTP="
set /p OTP=验证码（留空则不带 OTP 直接试）: 
set "OTPARG="
if defined OTP set "OTPARG=--otp=%OTP%"

echo.
echo 正在发布（--ignore-scripts：lib/ 已构建好，跳过 prepack 重建）
call npm publish --access public --ignore-scripts %OTPARG%
if errorlevel 1 goto fail

echo.
echo ============================================
echo  发布成功
echo ============================================
call npm view @bushizhanghan/dsh-workmate version
echo.
echo 下一步：把这行输出发我，我去提 awesome-dsh-plugin 的 PR。
pause
exit /b 0

:fail
echo.
echo ============================================
echo  失败：把上面的红字整段复制出来
echo  E403 + Two-factor = 验证码过期，重新双击本脚本再试一次
echo  如果验证器里根本没有 npm 这一项（只注册过安全密钥），
echo  改用 npmjs.com 上带 Bypass 2FA 的 Granular Token 发布
echo ============================================
pause
exit /b 1

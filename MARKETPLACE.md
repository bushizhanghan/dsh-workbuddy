# 上架清单（DeepSeek 插件市场）

两件事，缺一不可：**npm 上有包** + **精选列表里有条目**。市场（dsh-market）与目录站都从 `awesome-dsh-plugin` 的索引读，索引只收录 npm 上取得到版本的包，GitHub-only 的条目只能靠命令行装、不进目录。

## 1. 发布 npm 包

npm 现在硬性要求：**发布必须满足其一 —— 账号开了 2FA，或用带 Bypass 2FA 的 granular access token**。账号 `tfa:false` 时任何 OTP 都会被拒（`E403 Two-factor authentication or granular access token with bypass 2fa enabled is required`）。

开 2FA 最快的做法是命令行，不用走网页向导：

```sh
npm profile enable-2fa auth-and-writes   # 终端出二维码 → 验证器 App 扫 → 输 6 位码 → 抄走恢复码
```

然后发布（**不要**预先写 `--otp=`，让 npm 自己停下来问，避免和 30 秒倒计时赛跑）：

```sh
npm publish --access public    # 作用域包必须带 --access public
```

坑：**安全密钥（Security key / passkey / Windows Hello）不能用于命令行发布**——CLI 只认 6 位 TOTP，网页向导里进到 "Add your security key" 就是走错了，退回上一步选 "Authenticator app"。若账号只绑了安全密钥，只能建 granular token（Read and write + 勾 Bypass 2FA + scope 选 `@bushizhanghan`），写进 `~/.npmrc` 的 `//registry.npmjs.org/:_authToken=`。

发布前自检：

```sh
npm pack --dry-run             # 确认 tarball 里是 lib/ + cordis.patch.yml + README + LICENSE
npm view @bushizhanghan/dsh-workmate version
```

`prepack` 会自动跑 `pnpm build`，所以不需要手动 `lib/` 之后再发。

## 2. 提 PR 到精选列表

仓库：<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin>
分类：**Models & Providers**（`README.md` 与 `README.zh.md` 各加一行，格式与邻近条目一致）

```md
- [bushizhanghan/dsh-workmate](https://github.com/bushizhanghan/dsh-workbuddy) - WorkBuddy 国内版/国际版的免费与付费模型接入 DSH；兼容分支支持 dsh 0.2.0-rc.2 ~ 0.2.1。<!-- zh -->
- [bushizhanghan/dsh-workmate](https://github.com/bushizhanghan/dsh-workbuddy) - WorkBuddy's free and paid models (domestic and international) for DSH; compat fork covering dsh 0.2.0-rc.2 through 0.2.1. <!-- en -->
```

评审要点（对方会逐条核对）：能 `dsh plugin add` 装上、描述与代码一致、分类正确、有人维护。别写夸大数字。

## 3. 收录后的验证

- dsh 0.2.1+：**插件 → 发现 → 索引源** 里确认 `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json` 可读。
- 目录站：<https://awesome-dsh-plugin.com>、<https://dshmarket.com> 通常一天内出现条目。
- 装给自己验一遍：`dsh plugin --profile web add @bushizhanghan/dsh-workmate`。

## 4. 与上游的关系（提 PR 时如实写）

上游 `Faide-cyber/dsh-workbuddy` 仍是同一功能的主线。这个包只在两处不同（见 `patches/`），上游合并等价修复后建议切回官方包，避免同一功能两个来源。

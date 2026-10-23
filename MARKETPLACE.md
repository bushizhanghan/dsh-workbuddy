# 上架与发版（DeepSeek 插件市场）

市场收录走的是「目录站条目 + 可下载的包」两条腿，缺一条用户在 dsh 里就装不上。

## 1. 条目现状

目录站 <https://awesome-dsh-plugin.com> 的数据源是
<https://github.com/awesome-dsh-plugin/awesome-dsh-plugin> 仓库里的
`data/plugins/<owner>__<repo>.yml`。本包条目已合并：

- 文件：`data/plugins/bushizhanghan__dsh-workbuddy-harness.yml`（PR #8658）
- 分类：`model`（Models & Providers）
- 页面：<https://awesome-dsh-plugin.com/p/bushizhanghan/dsh-workbuddy-harness/>
- 安装包地址：`https://github.com/bushizhanghan/dsh-workbuddy-harness/releases/latest/download/dsh-workmate.tgz`

注意 `tarball` 指向 `releases/latest`，所以**发新版只要更新 Release 附件，条目不用再改**。

dsh 客户端「插件 → 发现 → 索引源」读的是 npm 包 `dsh-plugin-catalog` 里的
`index.json`（jsDelivr 分发），由上游每天多次重建。条目合并后如果那里还看不到，
等下一次重建即可，不用重复提 PR。

## 2. 发一版要做的三件事

### 2.1 先改版本号

`package.json` 的 `version` 是唯一来源，构建时由 tsdown 注入。同时更新
`CHANGELOG.md` / `CHANGELOG.en.md`。

### 2.2 发布 npm

npm 硬性要求：**发布必须满足其一 —— 账号开了 2FA，或用带 Bypass 2FA 的 granular
access token**。账号 `tfa:false` 时任何 OTP 都会被拒
（`E403 Two-factor authentication or granular access token with bypass 2fa enabled is required`）。

```sh
npm pack --dry-run              # 确认 tarball 里是 lib/ + cordis.patch.yml + README + LICENSE
npm publish --access public     # 作用域包必须带 --access public
```

**不要**预先写 `--otp=`，让 npm 自己停下来问，避免和 30 秒倒计时赛跑。安全密钥
（passkey / Windows Hello）不能用于命令行发布，CLI 只认 6 位 TOTP。

`prepack` 会自动跑构建，不需要手动先 build。

### 2.3 更新 GitHub Release

市场的安装包就是 Release 附件，必须叫 `dsh-workmate.tgz`：

```sh
npm pack                                  # 产物 bushizhanghan-dsh-workmate-<version>.tgz
mv bushizhanghan-dsh-workmate-<version>.tgz dsh-workmate.tgz
gh release create v<version> dsh-workmate.tgz --title v<version> --notes "..."
```

没有 `gh` 时用 API：先 `POST /repos/bushizhanghan/dsh-workbuddy-harness/releases` 建 tag，
再 `POST https://uploads.github.com/repos/.../releases/<id>/assets?name=dsh-workmate.tgz`
（`Content-Type: application/gzip`，`--data-binary @dsh-workmate.tgz`）。

## 3. 发完怎么验

```sh
npm view @bushizhanghan/dsh-workmate version
curl -sL -o /tmp/x.tgz https://github.com/bushizhanghan/dsh-workbuddy-harness/releases/latest/download/dsh-workmate.tgz && tar -tzf /tmp/x.tgz | head
dsh plugin --profile web add @bushizhanghan/dsh-workmate
```

三处都对上就算生效：npm 版本号是新的、Release 附件能下、`dsh plugin add` 装得进去。

## 4. 与上游的关系（提 PR 或答辩时如实写）

上游 `Faide-cyber/dsh-workbuddy` 仍是同一功能的主线。本包最早只是为了在 dsh 0.2.1
上能加载，之后代码库做过一轮结构整理，行为不变。上游合并等价修复后建议切回官方包，
避免同一功能两个来源。

评审要点：能 `dsh plugin add` 装上、描述与代码一致、分类正确、有人维护。别写夸大数字。

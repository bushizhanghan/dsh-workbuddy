# 上架清单（DeepSeek 插件市场）

两件事，缺一不可：**npm 上有包** + **精选列表里有条目**。市场（dsh-market）与目录站都从 `awesome-dsh-plugin` 的索引读，索引只收录 npm 上取得到版本的包，GitHub-only 的条目只能靠命令行装、不进目录。

## 1. 发布 npm 包

```sh
npm login                      # 一次性，需要 OTP
npm publish --access public    # 作用域包必须带 --access public
```

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

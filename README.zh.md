# DSH Workmate

把 WorkBuddy 的模型目录接进 DeepSeek Harness —— 国际版（`www.workbuddy.ai`）和国内版
（`copilot.tencent.com`）都支持，免费模型和付费模型都在内。**不需要**装 WorkBuddy 桌面端：
在浏览器里登录即可，插件自己按区域保存凭据，位置在 `$DSH_HOME`。

- **登录** —— 走官方 CLI 的浏览器 OAuth，两个区域各自独立。如果机器上已经装了并登录过桌面端，
  也可以只读导入它的凭据。
- **账号** —— 每个区域一份账号列表，支持显式切换、卡片上显示剩余积分、给账号加备注。
  插件的凭据副本从不写回桌面端的文件。
- **一键签到** —— 每日签到、猫猫旅行、成长中心任务，一次操作全部收取。自动签到可选，默认关闭。
- **区域隔离** —— 凭据、模型目录、余额三者互不串台。切换账号只影响之后的请求，在途请求
  继续用它原来那个账号。
- **开箱即用** —— 装上、启用、选模型，没有别的配置项。

支持的宿主：DSH `0.2.0-rc.2` 至 `0.2.1`。

## 环境要求

- Node.js 22.19+ 或 24+
- 已安装 DeepSeek Harness，使用 `web` profile
- 任一区域的 WorkBuddy 账号

## 安装

```sh
dsh plugin --profile web add @bushizhanghan/dsh-workmate
dsh web
```

然后打开 **设置 → 插件 → DSH Workmate**，点 **连接**，在弹出的 WorkBuddy 页面里登录。

也可以在终端登录：

```sh
dsh plugin --profile web exec dsh-workmate login
```

安装、升级、登录之后都要**重启 `dsh web`**。只刷新浏览器不够 —— 宿主把插件的模块留在内存里。

## 选模型

默认范围是**仅免费模型**，选择器里列出来的就是该区域实时目录当前标价 `x0.00` 的那些。
在设置卡片上把范围切成**全部模型**才能看到付费模型，注意会扣积分。

默认模型可以固定在 `~/.dsh/settings.yaml`：

```yaml
agent-default-model:
  provider: workbuddy-ai
  model: hy3
  reasoningEffort: high
```

请填该区域当前确实列出的 id。模型列表就是实时目录返回的内容，写死的默认值会过时；
`hy3` 在撰写时两个区域都免费。

## 登录流程

每个区域独立访问自己的登录接口：

1. `POST /v2/plugin/auth/state?platform=CLI&nonce=`
2. 打开返回的 `authUrl`
3. 轮询 `GET /v2/plugin/auth/token?state=` —— 还在等待时返回 `11217`
4. 把 token 写入该区域的插件副本：国际版 `$DSH_HOME/.workbuddy-ai-auth.json`，
   国内版 `$DSH_HOME/.workbuddy-cn-auth.json`

桌面端的 `workbuddy-desktop-ai.info`（国际）和 `workbuddy-desktop.info`（国内）只读打开，
插件只写自己通过 OAuth 拿到的副本。

**断开**和 `logout` 只删对应区域的插件凭据，桌面端不受影响。

## 设置项

设置 → 插件 → **DSH Workmate**：

- 按区域**连接 / 断开**
- 两个区域的账号列表：显式切换、剩余积分、账号备注、连通性测试
- 国内账号勾选、自动签到开关（默认关闭）
- 刷新间隔 —— 当前账号默认 15 分钟一次，其他账号 60 分钟一次
- 模型范围：**仅免费模型**（默认）/ **全部模型**

同样的配置也可以写在 profile 的 `cordis.patch.yml` 里：

```yaml
- id: llm-workbuddy
  config:
    modelScope: free          # 国际版：free | all
    cnModelScope: free        # 国内版：free | all
    probeConsent: false       # 真实模型探测，默认关闭
    autoCheckin: false        # 国内自动签到，默认关闭
    refreshActiveMinutes: 15
    refreshInactiveMinutes: 60
    # 通过局域网访问 DSH Web 时用的 Host（不要写进回环名单）
    # allowedHosts: ["192.168.1.10"]
    # authFile / cnAuthFile：仅当桌面凭据不在默认位置时才需要
```

环境变量：

| 变量 | 作用 |
|---|---|
| `DSH_WORKBUDDY_AUTH_FILE` | 覆盖国际版桌面凭据路径。OAuth 凭据仍然写插件自己的文件。 |
| `DSH_WORKBUDDY_CN_AUTH_FILE` | 覆盖国内版桌面凭据路径。 |

## 命令行

```sh
dsh plugin --profile web exec dsh-workmate login
dsh plugin --profile web exec dsh-workmate status
dsh plugin --profile web exec dsh-workmate doctor
dsh plugin --profile web exec dsh-workmate logout
```

`status` 和 `doctor` 支持 `--json`。`logout` 只删 `$DSH_HOME/.workbuddy-ai-auth.json`。

## 兼容性

7 个 `@deepseek-ai/dsh-*` peer 依赖声明为
`>=0.2.0-rc.2 <0.2.1 || >=0.2.1-0 <0.3.0-0`，而不是钉死某一个版本。DSH 在加载插件前会
逐条校验 peer 是否满足当前宿主，精确钉死会让插件在别的宿主构建上被整体拒载。第二段区间是
让 `0.2.1-rc.2` 能被命中的关键 —— 预发布版本不落在朴素的 `>=0.2.0-rc.2 <0.3.0-0` 里。

上界 `<0.3.0-0` 是刻意留的：0.3 的宿主可能改插件接口，这个包不会假装还能用。

## 故障排查

| 现象 | 处理 |
|---|---|
| 设置里没有卡片，模型列表也没有 WorkBuddy | 重启 `dsh web`。刷新浏览器不会重载宿主。 |
| 点连接后 `dsh web` 直接退出 | 无头 Linux 没有 `xdg-open` 时会出现，升级到处理了 spawn `error` 的版本，或者用卡片上的登录链接。 |
| 用局域网地址打开卡片报 403 `request-not-trusted` | 把该地址加进 `allowedHosts`，不要加进回环名单。 |
| 登录成功但模型列表是空的 | 该区域的目录请求失败或返回为空。检查网络和 token 是否还有效 —— 列表保持为空，不会借用另一区域的模型。 |
| `doctor` 显示 signed-out | 先跑 `login`，或者确认国际版桌面端已登录。 |
| 看不到付费模型 | 在设置卡片把范围切成「全部模型」。会消耗积分。 |

## 与上游的关系

这个包最初是 [`Faide-cyber/dsh-workbuddy`](https://github.com/Faide-cyber/dsh-workbuddy)
（v1.0.12，提交 `9951d25`）的兼容分支，由
[@bushizhanghan](https://github.com/bushizhanghan) 维护。同一功能的主线仍在上游；分支存在
的原因有两个：原包在 DSH 0.2.1 上加载不了，以及宿主默认的客户端名会被上游服务判成未知客户端。

之后代码库做过一轮整理 —— 模块划分、命名、注释、构建与 CI 接线 —— 行为保持不变。
原始 MIT 许可证与版权声明在 `LICENSE` 和 `NOTICE` 里原样保留，相对上游 1.0.12 的差异见
`patches/`。

如果上游发布了等价的修复，建议切回官方包。

## 免责声明

仅供个人学习与研究，只驱动你自己的 WorkBuddy 账号在本机调用。请遵守 WorkBuddy 服务条款。
本项目与腾讯、WorkBuddy、DeepSeek 均无关联。

## 许可证

[MIT](./LICENSE)

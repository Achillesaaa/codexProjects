# Windows 本地继续验证

## 已知信息与边界

- 用户 Windows 电脑，Kindle USB 存储盘为 E:，固件 5.16.2.1.1，已经越狱及安装 KUAL。
- 当前聊天使用云端 Linux，未接通电脑 USB、E 盘或本地终端，无法远程点击 Kindle 屏幕。
- 已搜索可用工具，只有 handoff 状态查询，没有实际迁移当前聊天到本地的操作入口；不能声称已切换。需要在 Windows Codex 客户端选择本地工作环境，或在本地克隆此仓库后新建聊天。
- 只能验证现有工具和天气请求。禁止刷机、升级/降级、重做越狱、自动安装依赖、关闭证书校验、启用 SSH 或修改系统配置。

## 本地准备

在 Windows 将本仓库克隆到普通工作文件夹（不要把 Kindle E 盘根目录当成 Git 工作目录）。在本地 Codex 打开该目录，并明确告诉本地聊天本页路径。

将以下提示交给本地聊天：

> 请先读 kindle-calendar/README.md、docs/DESIGN.md、docs/WEATHER-RESEARCH.md 和 docs/WINDOWS-HANDOFF.md。Kindle 通过 USB 连接，用户确认盘符 E:，请只读检查卷及 extensions/KUAL 目录，不访问书籍或私人文件。确认设备后生成检测包，只将本项目扩展复制到 E:\extensions\kindle-weather-check，不覆盖现有同名目录或结果。用户在 Kindle 上手动连接 Wi-Fi 并通过 KUAL 启动检测。日志返回后验证 15 天及未来连续 24 小时覆盖，再决定天气适配。禁止刷机、固件变更、重做越狱、强行修复或绕过证书检查。HTTP 200 不代表验证成功。

## 检测流程

1. 运行 `python kindle-calendar/tools/package.py`。
2. 将 zip 中的 extensions 文件夹合并复制至 E 盘；先检查同名目录，不覆盖结果。
3. Windows 安全弹出，再拔下数据线。用户在 Kindle 上手动连接 Wi-Fi。
4. 打开 KUAL，选择 Weather Check → Run network test。
5. 等待约 2 分钟后接回 USB。
6. 读取 `E:\extensions\kindle-weather-check\results` 内本次目录。report.txt 最后应为 DONE。
7. 检查 .body、.error、.headers 和报告，不只看退出码。原始响应不提交到公共 GitHub。

检测包仅写自己的目录，可在检测结束后删除其目录卸载。若缺少 curl/wget，或 TLS、网络、数据格式失败，记录原因并停止，不触发系统修改。

## 接续开发的验收条件

先记录真实设备时钟与测试时间、请求城市、响应更新时间、15 天日期覆盖、24 个逐小时连续时段及真机可访问性。之后再接入正式天气模块、本地 lunar 库和缓存。应用本身离线可启动、待办持久化、跨午夜正确、退出恢复首页均需真机验收。

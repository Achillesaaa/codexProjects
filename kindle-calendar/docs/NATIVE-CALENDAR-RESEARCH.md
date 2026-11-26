# KUAL 本机日历项目检索与原生实现路线

检索日期：2026-11-26。目标：Paperwhite 3，固件 5.16.2.1.1，已有越狱和 KUAL。

证据来自下列 GitHub README、目录及部分源文件。文中的“实测”均指项目作者声明，不是本项目已完成验证。没有在用户 Kindle 上安装或运行这些项目。

## 1. 结论

本轮没有核实到一个可以直接安装、同时满足本项目两页交互、中文待办增删改、农历宜忌、免费 15 天天气和离线恢复的成熟独立 KUAL 日历扩展。

有价值的参考分成三组：

1. **日历功能参考**：`winrich/dashboard.koplugin`、`louiskl/inkdeck`。功能接近，但都依赖 KOReader，不能当成独立 KUAL 原生插件直接安装。
2. **独立本机运行参考**：`GuoBug/kindle-weather-station`、`cykrr/kindle-dashboard`、`NiLuJe/FBInk`。有本机绘制、触控或原生窗口的可研究实现，需自行补齐日历业务和中文输入。
3. **非交互屏保/网页参考**：`ikeee/kindle-dynamic-calendar`、`flywhc/KindleCalendar`、`Frankhbu/kindle-calendar`、`Wsine/kindle-calendar`。可借鉴历法布局和日期处理，不能直接作为正式原生前端。

**实现方向保持为：已有 KUAL 启动一个独立的本机日历程序；不以浏览器显示网页或服务器生成 PNG 作为正式应用。** 本地程序在内存中生成图像再交给 FBInk，是本机渲染，不应与远程截图方案混淆。HTML 原型仅用于沟通版式。

KUAL 的职责是启动与管理扩展菜单；它不是提供月历、表单和中文输入控件的应用开发框架。主体仍需要自己的界面、事件处理、数据持久化和退出机制。

## 2. 重点日历项目

### 2.1 winrich/dashboard.koplugin：最接近中文功能需求

- 仓库：[winrich/dashboard.koplugin](https://github.com/winrich/dashboard.koplugin)
- 作者声明实测：**PW3、1072×1448、KOReader v2026.07.1**；README 未据此证明本项目固件的全部兼容性。
- 内容包括时钟、农历、节气、月历、天气、倒数日和可勾选待办。
- `dashboard_agenda.lua` 把日期和待办数据层从绘制中拆出，记录 id、date、text、done；可研究按日期管理和日期计算。
- `dashboard_lunar.lua` 有本地农历和节气实现。它不等于已经核实满足每日宜忌；本项目的宜忌仍需另外接入已选离线万年历组件。
- 数据层使用 KOReader 的 `luasettings`、`datastorage`，不能不加修改地放进普通 Lua/KUAL 环境。
- README 的已完成待办自动清理策略、点击刷新天气、城市列表和默认刷新周期不等于本项目需求，不能原样继承。
- 检索到的仓库许可证为 **AGPL-3.0**，复用代码需按许可证处理。

源码入口：

- [待办数据层](https://github.com/winrich/dashboard.koplugin/blob/master/dashboard.koplugin/dashboard_agenda.lua)
- [农历与节气](https://github.com/winrich/dashboard.koplugin/blob/master/dashboard.koplugin/dashboard_lunar.lua)
- [界面与插件入口](https://github.com/winrich/dashboard.koplugin/blob/master/dashboard.koplugin/main.lua)

定位：**中文历法和待办业务设计优先参考；不是独立 KUAL 前端底座。**

### 2.2 louiskl/inkdeck：月历、议程与本地待办

- 仓库：[louiskl/inkdeck](https://github.com/louiskl/inkdeck)，MIT。
- 在设备本机绘制，不需要截图服务器，但依赖 KOReader。
- Calendar 有月视图、议程视图及 ICS 输入；Reminders 在设备保存 JSON，支持添加、勾选和删除。
- 主要目标为无触屏 Kindle 4，也支持触控路线；README 明确是早期版本，不能把“支持其他 KOReader 设备”当成 PW3 实测结论。
- 检查了 `Calendar:drawMonth`、`Calendar:drawAgenda` 及 reminders 的 load/save 等函数。月历与事项模型值得参考。
- 未证明内置中国农历宜忌；待办是否完整支持本项目的按日期编辑，需要再对照实现。
- 默认天气只到 7 天，不满足本项目 15 天要求；需要修改接入层。

源码入口：[calendar.lua](https://github.com/louiskl/inkdeck/blob/main/inkdeck.koplugin/inkdeck/widgets/calendar.lua)、[reminders.lua](https://github.com/louiskl/inkdeck/blob/main/inkdeck.koplugin/inkdeck/widgets/reminders.lua)。

定位：**交互月历、列表与本地数据模型参考；不能直接当成无 KOReader 的 KUAL 插件。**

### 2.3 ikeee/kindle-dynamic-calendar：自动换日的离线屏保

- 仓库：[ikeee/kindle-dynamic-calendar](https://github.com/ikeee/kindle-dynamic-calendar)。README 标注 MIT；包含派生上游代码，复用前应逐文件核实声明。
- 作者实测为 **PW1 / 5.6.1.1**，不是 PW3。
- 电脑提前生成每日 PNG，设备根据日期替换屏保，结合 linkss、RTC 与 cron 保持换日。
- 月历、今日高亮及中国休/班标记有参考价值，但不是支持待办输入的本机交互程序。
- 安装流程会涉及 cron/屏保调度，不能为本项目验证直接执行。

定位：**仅参考跨午夜、时区和低功耗调度，不作为两页交互应用底座。**

### 2.4 flywhc/KindleCalendar：有 PW3 经验，但属于 HTML

- 仓库：[flywhc/KindleCalendar](https://github.com/flywhc/KindleCalendar)，README 标注 MIT；第三方字体和服务须单独核实。
- 作者明确只在自己的越狱 KPW3 上测试，具备农历、天气、离线周历切换等内容。
- 实际运行方式是内置浏览器打开本地 `file:///mnt/us/calendar/index.html`，不是原生界面。
- 作者记录了浏览器兼容性、字体、反复刷新导致内存问题，以及部分固件不能打开 file URL 的限制。
- 使用的是较早的和风天气接法，不能据此保证当前免费 15 天接口。

定位：**布局与旧设备问题参考；正式版不采用本地 HTML 浏览器路线。**

### 2.5 静态生成工具与信息不足的仓库

- [Frankhbu/kindle-calendar](https://github.com/Frankhbu/kindle-calendar)：电脑浏览器生成 758×1024 月历 PNG，包含本地农历等；不是 KUAL 本机程序。根仓库未核实到明确主项目许可证，不直接复制整套代码。
- [Wsine/kindle-calendar](https://github.com/Wsine/kindle-calendar)：生成 PDF 再发送到 Kindle，属于静态日历阅读方案。
- [Yinwenming0001/kindle-calendar-v7.0](https://github.com/Yinwenming0001/kindle-calendar-v7.0)：检索时仓库根目录只有很短的 README，没有可评估的日历实现，不能因项目名称中的版本号就将其列为可用插件。
- [xyztony999/kindle-calendar](https://github.com/xyztony999/kindle-calendar)：描述明确为云端渲染 PNG、设备拉取，不作为原生交互方案。

## 3. 本机原生技术底座

### 3.1 GuoBug/kindle-weather-station：最直接的 KUAL 本机参考

- 仓库：[GuoBug/kindle-weather-station](https://github.com/GuoBug/kindle-weather-station)，MIT。
- KUAL + Shell + Python/Pillow，本机绘图，通过 `eips` 显示，读取触控事件并提供退出操作。
- 检查了 `render.py` 的 Pillow 绘制、`TouchMonitor` 和 `find_touchscreen`，以及 `weather.sh` 的启动和停止流程。
- README 默认画布 **758×1024**，触控处理中也有相关坐标；不能直接作为 PW3 的 1072×1448 成品。
- Python/Pillow 是否存在须检测，不能仅凭有 KUAL 就认为可运行。
- 默认天气源不是已验证的免费大陆 15 天路线；不继承其天气能力结论。
- `weather.sh` 包含停止/启动 Kindle framework 和网络设置行为；本项目只能研究并重新设计生命周期，不在验证阶段照搬执行。

定位：**可研究如何从已有 KUAL 启动本机界面、绘图、处理触控和退出；日历、中文输入及缓存需独立实现。**

### 3.2 cykrr/kindle-dashboard：GTK2 原生窗口参考

- 仓库：[cykrr/kindle-dashboard，native 分支](https://github.com/cykrr/kindle-dashboard/tree/native)。检索时未见明确主项目 LICENSE，不直接复制代码发布。
- Go + cgo + GTK，本机应用，有时钟、日期、小月历、电量及可选的外部集成。
- 核查了 [app.go](https://github.com/cykrr/kindle-dashboard/blob/native/cmd/dashboard/app.go)：声明 `gtk+-2.0 x11`，创建 GTK 顶层窗口和按钮，设置符合 Kindle 窗口管理规则的标题。
- 原生 GTK 对需要表单、列表和弹窗的应用有参考价值，但不是已经完成中文输入、农历宜忌和按日待办的日历插件。
- 作者标注 experimental/personal-alpha，仅作者设备测试；未证明本项目固件兼容。
- suspend-cycle 和部署脚本涉及设备状态，不能盲目运行。

定位：**若优先原生控件路线，研究 GTK2 窗口、事件循环和关闭处理；本项目应独立实现并先验证库/ABI。**

### 3.3 NiLuJe/FBInk：本地绘制能力，不是 UI 工具包

- 仓库：[NiLuJe/FBInk](https://github.com/NiLuJe/FBInk)，GPL-3.0 系列，具体按所用文件/版本确认。
- 支持 Kindle 墨水屏 framebuffer 文本/图片绘制及刷新控制，可作为本机界面显示层。
- **FBInk 本身不提供完整的月历、待办编辑、中文键盘或应用事件循环。** 触控通常需读取输入事件，文本输入、焦点、数据存储及安全退出都要另行实现。
- 可以由 Python/Pillow 在本机生成画面，也可以由 Lua/C 组织绘制；“本机生成图片再显示”仍是本机程序。

### 3.4 不能直接用于此设备的“同分辨率”项目

[rituparna-ui/slate](https://github.com/rituparna-ui/slate) 有 Calendar、Todo、Notes 键盘、手势及局部刷新，GPL-3.0；README 指向 **MediaTek / hwtcon_v2** 的面板接口。虽然同样写着 1072×1448，但不能据此认为适配 PW3 的驱动。其字体仅覆盖 ASCII 32–126，也不满足中文。安装脚本还涉及持久 SSH/启动钩子，不纳入本项目部署流程。

[pragyaangaur/Inkwell](https://github.com/pragyaangaur/Inkwell) 作者提及 PW3 / 5.16.2.1.1，但它是 Alpine 用户空间和主界面接管方案，不是普通 KUAL 日历扩展。即使兼容机型相同，也不符合本项目保持现有系统、只增加插件的方向。

## 4. PW3 / 5.16.2.1.1 兼容性要点

工具链名称不能只看 ARM 或分辨率。

[NiLuJe/koxtoolchain 的目标表](https://github.com/NiLuJe/koxtoolchain)区分：

| 目标 | 上游说明 |
| --- | --- |
| `kindlepw2` | PW2 及后续设备的对应旧固件工具链目标 |
| `kindlehf` | 固件 >= 5.16.3 的设备 |

本项目固件是 5.16.2.1.1，应优先核对 `kindlepw2` 对应的工具链/包及实际 ELF 依赖，不能直接拿 `kindlehf` 二进制运行。Python、LuaJIT、FBInk、GTK/VTE 等组件也分别有 ABI 和版本要求。

[thiagokokada/kual-next](https://github.com/thiagokokada/kual-next) README 明确仅面向 5.16.3 及以上 hard-float 设备，旧 ARMEL 设备不支持。本项目保留现有可用 KUAL，**不为了使用新启动器而升级固件**。

## 5. 推荐组合与开发顺序

### 5.1 首选验证路线

保留已有 KUAL，用 `config.xml` + `menu.json` 启动独立程序。优先验证 **本机绘制层（FBInk 或已有兼容显示工具）+ 触控事件层 + 本地业务层**：

```text
KUAL
  -> 启动/退出包装脚本
     -> 日历与待办程序（在 Kindle 本机运行）
        -> 显示：兼容的 FBInk/本机渲染
        -> 输入：触控事件、按钮命中、中文输入
        -> 日期：公历网格 + 离线 lunar 组件
        -> 数据：按日期待办 + 位置配置 + 天气缓存
        -> 天气：后台获取与校验，不阻塞界面
```

若设备已有兼容 Python3/Pillow，可沿本机 Python 方向开发并使用 `lunar-python`。如果不具备，不自动安装或假定能用；比较兼容 LuaJIT 或编译后的原生程序，再确定运行时。

如果最终更适合使用系统原生控件，则选择 **GTK2 独立窗口** 作为备选，先检查设备库和工具链，再验证窗口、中文字体、文本输入、勾选和退出。不能因为 GTK 可以画中文字就假定中文输入法已经可用。

不把 KOReader 作为默认必装依赖；若以后希望直接采用 KOReader 插件，应作为架构需求变更明确说明。

### 5.2 按日历优先的最小验证顺序

1. 只读检查设备已有运行时、显示工具、输入设备与固件信息。
2. 验证一个由 KUAL 启动并正常退出的小界面，确认不需要更改系统配置。
3. 离线月历：正确年月/星期/翻月/今日定位，再接农历。
4. 点日期及待办：中文输入、新增、修改、删除、勾选，保存后重启恢复。
5. 日历页：设备时间、电量、真实宜忌、导航和跨午夜。
6. 接入已真机验证的免费天气及两小时缓存规则，独立测试断网和恢复。
7. 最后验证局部刷新、休眠恢复及功耗；不把作者特定设备的调度/框架/SSH 脚本当作通用安装器。

本轮只完成检索、源码核对和路线收敛，未更换运行时、安装项目或修改设备。正式验收仍按 [REQUIREMENTS.md](REQUIREMENTS.md) 执行。

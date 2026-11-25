# Kindle Paperwhite 3 日历

目标设备：Kindle Paperwhite 3（1072 × 1448），固件 5.16.2.1.1，已经越狱并安装 KUAL。

## 当前交付范围

- [完整需求及界面设计](docs/DESIGN.md)
- [免费天气源检索及选型](docs/WEATHER-RESEARCH.md)
- [可以独立打开的交互原型](prototype/index.html)：日历、月历、农历、待办增删改及勾选、城市输入、退出示意、缓存状态演示。
- [KUAL 天气检测扩展](extensions/kindle-weather-check)：在设备自身网络下检测中国天气网和 Open-Meteo，保存日志与原始响应。
- [Windows 本地接续说明](docs/WINDOWS-HANDOFF.md)
- `python tools/package.py`：生成可复制到 Kindle 的检测包 `dist/kindle-weather-check.zip`。

**这不是已完成的 Kindle 日历安装包。** 原型的天气、时间、电量及宜忌是示例；农历通过桌面浏览器 Intl 换算。真机日历渲染、中文输入、系统电量、正式天气适配、持久化离线缓存及本地 lunar 库接入尚未实现。天气检测代码可从 KUAL 运行，但尚无真机结果。原型的退出只是示意，不控制 Kindle 系统。

## 查看原型

在现代桌面浏览器打开 `prototype/index.html`，或在仓库根目录执行：

```sh
python -m http.server 3000
```

访问 `http://localhost:3000/kindle-calendar/prototype/`。页面之外的“预览条件”用于演示离线、两小时缓存边界及更新成功/失败，不属于 Kindle 的产品界面。

## 验证

```sh
python -m unittest discover -s kindle-calendar/tests -v
python kindle-calendar/tools/package.py
```

页面交互检查需要本机已经具备 Node、Playwright 和 Chromium，见 `tests/check-ui.cjs`。测试与打包命令不访问 Kindle，也不请求真实天气。

## 安全约束与数据

不刷机、不升级或降级固件、不重做越狱；检测失败不自动安装依赖、启用 SSH、修改网络或证书设置。没有云端到 Windows E 盘的访问通路时，不能声称已部署或验证设备。

本仓库保存了对话中确认的设计，以及工作区重建后恢复的原型和检测实现；不是先前临时文件的逐字节备份。不包含聊天原文、凭据、设备序列号或真机日志。

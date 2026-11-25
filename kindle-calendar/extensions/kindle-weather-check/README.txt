Kindle Weather Check 1.1

在 Windows 将本目录复制到 E:\extensions\kindle-weather-check。
不要覆盖现有同名目录或结果。
安全弹出 Kindle，拔下 USB；用户手动连接 Wi-Fi，打开 KUAL。
选择 Weather Check -> Run network test，等待约 2 分钟后接回 USB。
查看 results 内本次目录的 report.txt，最后一行应为 DONE。
报告和 .body/.error/.headers 为验证材料，请勿提交到公共仓库。

只读取版本、时钟及已有工具，查询杭州公共示例天气。
每个接口一次请求，无自动重试，单次请求约 22 秒后中止。
不刷机、不重启、不升级、不启用 SSH、不改 Wi-Fi 或证书设置，不安装依赖。
只有 Python 3.8+ 已存在时才自动解析，否则保留原始响应。
失败时记录并停止对应检查，不强行修复。
原型界面不包含在本扩展中，本扩展不是正式日历应用。
检测结束后删除本目录即可卸载。

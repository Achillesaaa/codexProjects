# 免费天气方案检索记录

检索日期：2026-11-25。以下是项目说明和源码核对结果，不是大陆真机验证报告。费用、接口和权限可能变化，应按接入当时官方资料重新核实。

## 优先验证：中国天气网网站数据

参考项目：[hasscc/tianqi](https://github.com/hasscc/tianqi)。项目说明面向中国用户，支持 15 天及逐小时预报，无需 appkey。源码依赖 Home Assistant，不适合直接放入 Kindle，也没有查到明确 LICENSE，不能把它当成可随意复制发布的开源模块。

已核对其 `custom_components/tianqi/api.py`、`client.py` 和 `weather.py` 中的数据通路：

| 用途 | 数据通路 |
| --- | --- |
| 实况 | `https://d1.weather.com.cn/weather_index/{area_id}.html` 中的 dataSK |
| 每日 | `https://d1.weather.com.cn/weixinfc/{area_id}.html` 中的 fc.f |
| 小时 | `https://d1.weather.com.cn/wap_180h/{area_id}.html` 中的 fc180.jh |
| 搜索 | `https://toy1.weather.com.cn/search?cityname=...` |

这是网站使用的数据通路，并非已确认有长期服务承诺或数据使用许可的官方免费开放 API。公开可读、免密钥与有权复制发布数据不是同一件事。检测包独立编写，只验证响应，不复制上述项目代码，不运行响应中的 JavaScript。

接入前必须实测每日数量、日期、温度字段、未来 24 个时间点是否连续、发布时间、城市准确性和失败行为。不能仅凭 HTTP 200 或接口名中的 180h 判定满足需求。

## 免费备用候选：Open-Meteo

- 项目：https://github.com/open-meteo/open-meteo
- 文档：https://open-meteo.com/en/docs
- 条款：https://open-meteo.com/en/terms

文档支持最多 16 天预报及逐小时气温，非商业免费 API 无需 API Key；条款规定免费调用量限制并要求署名。它提供的是模型数据，当前温度不应宣传为用户位置的现场测量值。大陆连通性仍需用户设备验证，不能因其他网络可访问就宣称大陆稳定。

## 其他项目

- [JiangtaoQu/mojiweather_api](https://github.com/JiangtaoQu/mojiweather_api)：MIT；说明支持实况、15 天和 24 小时，依赖 HTML/内部接口，作者明确提醒页面变化会导致失效。暂不作为首选。
- [soulteary/funny-china-weather](https://github.com/soulteary/funny-china-weather)：BSD-3-Clause；腾讯天气实况与城市搜索适配参考，未证明覆盖本项目完整 15 天+24 小时要求。
- [GuoBug/kindle-weather-station](https://github.com/GuoBug/kindle-weather-station)：MIT；可以参考 KUAL、触控、退出等设备集成思路。运行时及默认分辨率需适配，未验证特定固件兼容性，不能直接等同完整日历插件。

此前考虑过心知天气与和风天气。心知免费逐日预报仅 3 天，完整权限可能收费，不作为最终免费默认方案。和风 v7 支持 15 天但检索时已标注即将弃用，v1 每日预报文档最多 10 天，因此不能把旧教程作为长期免费 15 天依据。

## 万年历

- https://github.com/6tail/lunar-python （MIT；检索时最新版要求 Python 3.8+）
- https://github.com/6tail/lunar-javascript （MIT；可打包本地文件）
- https://github.com/OPN48/cnlunar （MIT；黄历算法备选）

建议使用 6tail 同系列，按最终运行时选语言；获取农历、节气、节日以及 `getDayYi()` / `getDayJi()` 的宜忌。不要混合多个库的择日规则，也不要替代成随机文案。未把这些库的代码复制进当前仓库。

## 当前验证结论

云端请求 d1.weather.com.cn 曾被云环境的出站代理以 403 拦截，不能据此认定目标接口故障或大陆不可用。没有真机日志，尚不能确认任何天气路线在用户 Kindle 上可用。检测包以杭州为公共示例位置，不读取设备精确定位。

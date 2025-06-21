# TODO - 实时位置同步（MQTT）

> 目标：实现管理员位置的实时广播与普通裁判的实时显示功能。

---

- [x] 选择并验证免费 MQTT Broker（默认 `mqtt.eclipseprojects.io:1883`）。已改用 EMQX `zeb75588.ala.cn-hangzhou.emqxsl.cn:8084`。
- [x] 在 `package.json` 引入 `mqtt` 依赖。
- [x] 新建 `utils/mqtt.ts` 封装连接、发布、订阅、重连逻辑。
- [x] 在 `Map` 组件中：
  - [x] 当 `isAdmin` 为 `true` 时，持续获取 GPS 位置并通过 MQTT 发布。
  - [x] 当 `isAdmin` 为 `false` 时，订阅同一比赛 Topic，接收管理员位置并在地图上渲染。
- [x] 设计并添加管理员位置标记图标。
- [x] 提供 `env.local` 支持自定义 MQTT Host、Port、Username、Password。
- [x] 异常处理：断线重连、无 GPS 权限、无法连接 Broker 时提示。
- [x] 更新 README，说明如何启用实时位置同步。
- [ ] （可选）封装一个后台 Mock Publisher 方便本地调试。 
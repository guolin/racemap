# Sail Map – 帆船裁判实时定位与航线工具

> 基于 **Next.js 13 + React 18 + Leaflet + MQTT.js**

本项目旨在为帆船裁判团队提供一套 **轻量级、开箱即用** 的 Web 工具，用于
1. 裁判船（信号船）实时广播自身 GPS 位置及比赛航线信息；
2. 普通裁判在个人移动设备（手机 / 平板）上订阅并可视化裁判船位置、航线与风向；
3. 后续可扩展的比赛管理、成绩录入等功能。

---

## 在线体验

> 部署在 Netlify，访问地址示例：https://your-demo-url.netlify.app

如无真机，可在 **Chrome → DevTools → Sensors** 中手动模拟 GPS 坐标；或使用 README 末尾的 *Mock Publisher* 脚本快速发布随机位置数据。

---

## 目录结构

```
app/       Next.js App Router 页面
  ├─ page.tsx            首页（输入 / 生成比赛房间码）
  ├─ race/[id]/page.tsx  比赛地图页（根据角色判断是否为管理员）
  ├─ join/               加入过的比赛列表（占位）
  └─ manage/             创建 / 管理比赛（占位）
components/
  └─ Map.tsx             地图核心组件（Leaflet + MQTT）
utils/
  ├─ mqtt.ts             全局 MQTT 客户端封装
  └─ race.ts             房间码生成与缓存
/doc/                    需求、架构与业务文档
```

---

## 快速开始

1. 克隆仓库并安装依赖
   ```bash
   git clone <repo-url>
   cd RC
   npm install
   ```

2. 配置 MQTT WebSocket 连接参数（`env.local`）
   ```bash
   # 仅作示例，正式环境请替换为自有 Broker
   NEXT_PUBLIC_MQTT_PROTOCOL=wss
   NEXT_PUBLIC_MQTT_HOST=broker.emqx.io
   NEXT_PUBLIC_MQTT_PORT=8084
   NEXT_PUBLIC_MQTT_PATH=/mqtt
   # 可选 · 若 Broker 开启鉴权
   # NEXT_PUBLIC_MQTT_USERNAME=xxx
   # NEXT_PUBLIC_MQTT_PASSWORD=yyy
   ```

3. 本地运行
   ```bash
   npm run dev
   # 默认 http://localhost:3000
   ```

4. 构建与生产运行
   ```bash
   npm run build && npm start
   ```

---

## 核心功能

| 角色       | 功能描述                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------- |
| 裁判长（管理员） | 持续监听 **Geolocation**，每 15 秒将最新位置 & 航线信息发布至 `sailing/{courseId}/pos`（MQTT Retain）。 |
| 普通裁判   | 订阅同一 Topic，实时渲染裁判船位置；自身位置仅本地渲染，不对外广播。                                   |

### 数据格式
```json
{
  "id": "ADMIN",        // 发送端身份
  "lat": 31.229221,      // 纬度
  "lng": 121.476419,     // 经度
  "course": {
    "axis": 40,          // 风向 / 航线轴向 (°)
    "distance_nm": 0.9,  // 起航线至 1 标距离 (海里)
    "start_line_m": 100  // 起航线长度 (米)
  },
  "timestamp": 1688888888
}
```

---

## 主题（Topic）设计

- 位置/航线：`sailing/{courseId}/pos`
- 预留：`sailing/{courseId}/route`

> courseId 由 6 位 **Base36 大写字母/数字** 组成，首次进入网站自动生成并缓存于浏览器 LocalStorage。

---

## 部署到 Netlify

项目已内置 `netlify.toml` 与 `@netlify/plugin-nextjs`，无需额外配置即可一键部署：
1. 在 Netlify 创建站点 → 关联 Git 仓库
2. 构建命令 `npm run build`，发布目录 `.next`
3. 在 *Site Settings → Environment Variables* 配置上文 MQTT 变量

> 若需使用自有域名，请在 Netlify 中绑定即可。

---

## 贡献指南

1. Fork 仓库并新建分支 (`feat/xxx` 或 `fix/xxx`)
2. 提交 PR 前请执行 `npm run lint && npm run build` 确保无 TypeScript / ESLint 报错
3. PR 描述请尽可能详尽，欢迎 Issue 交流

---

## License

MIT © 2023 Sail-Map Authors

---

### Mock Publisher（可选）

如需在桌面端快速模拟裁判船位置，可使用以下 Node.js 脚本：

```bash
npm i mqtt -g
```

```js
// mock.js
import mqtt from 'mqtt';
const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');
const cid = 'DEMO01';
client.on('connect', () => {
  setInterval(() => {
    const payload = {
      id: 'ADMIN',
      lat: 31.2 + Math.random() * 0.1,
      lng: 121.4 + Math.random() * 0.1,
      course: { axis: 40, distance_nm: 0.9, start_line_m: 100 },
      timestamp: Date.now(),
    };
    client.publish(`sailing/${cid}/pos`, JSON.stringify(payload), { retain: true });
    console.log('pub', payload);
  }, 3000);
});
```

```bash
node mock.js
```

打开浏览器访问 `http://localhost:3000/race/DEMO01` 即可观察效果。

---

## 异常处理
- MQTT 连接失败 / 重连：页面顶部红色条提示。
- 浏览器定位权限拒绝：提示"无法获取定位权限"。

## 本地调试帮助
若需在无移动设备情况下模拟位置，可：
1. 使用 Chrome DevTools – Sensors 面板手动设置坐标。
2. 运行 *Mock Publisher* (TODO) 向指定 Topic 发布随机坐标。

---

## 地图模块重构 (2024-xx-xx)

项目已完成地图组件重构：

1. `LegacyMap.tsx` 已删除，核心逻辑拆分为 Hooks + UI 组件。
2. 主要文件
   * `src/features/map/RaceMap.tsx` – 新版主组件，组合所有 Hooks / 组件。
   * Hooks：`useLeafletMap` / `useDeviceOrientation` / `useGpsWatch` / `useMqttPosSync` / `useCourseDraw`。
   * UI：`TopBar` `SideToolbar` `CompassButton` `SettingsSheet` `ErrorBanner` `GpsPanel`。
3. Admin / Observer 功能保持不变，代码规模整体下降 ~50%，更易维护。

开发时建议遵循：

* 单文件 ≤300 行，超出请拆分（见 ESLint 规则）。
* 新增副作用逻辑优先写成自定义 Hook。
* UI 元素放到 `src/features/map/components/`，保持职责单一。

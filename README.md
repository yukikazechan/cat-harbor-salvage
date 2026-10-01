# 猫港打捞局 · 物理刮卡版

静态入口：`index.html`，无需构建或后端，无外部运行时资源。

- 每件货物有独立 Canvas 防伪涂层，使用 `destination-out` 根据真实鼠标/触摸轨迹擦除；实际透明面积达到 65% 后揭晓。
- 涂层外观与尺寸不暗示品质。货物有 1、2、4、6 格尺寸，装箱尺寸抽签与货物品质抽签独立。
- 62 种物品，含 12 种需鉴定重宝。真品概率 60%，赝品跌为废品残值。
- 一键全开激光动画结束后自动鉴定并打开结算面板；变卖/收藏仍由玩家选择。
- 保留本地存档、刮痕恢复、救济金、展厅图鉴与分红。键盘方向键选格，空格提供辅助刮开。

## 验证

```sh
npm ci
npm test
```

测试使用 Node + Playwright，无头 Chromium。默认使用当前环境已有的 `/root/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome`；其他环境可通过 `CHROMIUM_PATH` 指定 Chromium 可执行文件。

`validate.cjs` 自动启动本地 HTTP 服务并验证 21 项，包含真实鼠标拖动、CDP 移动触摸、停留无自动擦除、65% 揭晓、存档恢复、激光全开、鉴定真伪、收藏详情、现金结算、160 箱随机分布与浏览器无异常。

验证报告：`validation.log`；移动端截图：`validation-mobile.png`。`validate.py` 仅为旧入口兼容包装，实际执行同一份 Node 测试。

# 日本二手交易平台监控与分析系统
## 可行性分析与架构设计报告 (Feasibility & Design Report)

**致：** Petter (Project Owner)  
**来自：** Acting Architect (Gemini 3 Pro)  
**日期：** 2026-02-07  
**版本：** v1.0

---

## 1. 可行性分析 (Feasibility & Risk Assessment)

本节主要针对 **Mercari (煤炉)**、**PayPay Flea Market**、**Rakuma** 和 **Yahoo! Auctions (雅虎拍卖)** 四大平台的抓取难度、数据获取逻辑及法律/合规风险进行评估。

### 1.1 平台抓取难度评估

| 平台 | 抓取难度 | 防御机制 | 备注 |
| :--- | :--- | :--- | :--- |
| **Mercari** | ⭐⭐⭐⭐⭐ (极高) | 强力指纹识别、IP 封禁、验证码 (Recaptcha/Datadome等)、App API加密 | 目前业界公认最难抓取的平台之一。Web 端大量使用动态类名和 Shadow DOM，API 有签名校验。大规模抓取需要高质量的**住宅代理 (Residential Proxies)**。 |
| **Yahoo! Auctions** | ⭐⭐⭐ (中等) | 频率限制、登录验证 | 相对传统，结构较稳定。Web 端抓取较为容易，但若需实时监控（秒级），IP 消耗量依然巨大。 |
| **PayPay Flea Market** | ⭐⭐⭐ (中偏高) | 依托 Yahoo ID 体系，API 较为现代，但也具备反爬策略 | 它是 Yahoo 的移动端二手市场竞品，很多数据与 Yahoo 互通，但作为移动优先的平台，API 逆向可能比 Web 抓取更有效，但也更易失效。 |
| **Rakuma** | ⭐⭐⭐ (中等) | 乐天系防御，频率限制 | 相对 Mercari 稍微宽松，但作为日本乐天旗下，风控体系依然完善。 |

### 1.2 "Top 50 每日热销" 的定义与实现难点

**核心问题：** 这些 C2C 平台**通常不提供官方的“销量排行榜”**。
*   **平台逻辑：** 它们是“信息流”模式，展示的是“新上架”或“推荐”。
*   **如何估算销量：**
    *   我们必须抓取 **“Sold Out” (已售出)** 的商品列表。
    *   通过筛选 `Category` + `Status=Sold` + `Date=Today`，统计特定类目下的已售商品数量。
    *   **难点：** 无法获取全站数据。只能针对**特定类目**（如“游戏王卡片”、“奢侈品包”）进行采样统计。
    *   **结论：** 全站 Top 50 不可行且无意义。**建议改为“指定类目/关键词的成交量趋势分析”**。

### 1.3 监控频率与 IP 封禁风险 (Sniping Frequency)

*   **5-10 分钟频率：** 对于**捡漏 (Sniping)** 来说，5-10 分钟可能太慢。热门商品（如显卡、限量手办）通常在 **30秒-1分钟** 内被秒杀。
*   **风险：**
    *   如果单一 IP 每分钟请求 10 次以上搜索接口，Mercari 极大概率会触发验证码或临时封禁 (429 Too Many Requests)。
    *   **解决方案：** 必须构建**代理池 (Proxy Pool)**。对于高频捡漏，不仅需要轮换 IP，还需要维护大量的 **Browser Context (Cookies/Headers)** 以模拟真实用户行为。

### 1.4 战略建议 (Recommendation)

不要试图一开始就攻克所有平台的全站数据。

*   **MVP (最小可行性产品) 建议：**
    *   **首选平台：** **Yahoo! Auctions** 或 **PayPay Flea Market**。
        *   理由：Yahoo 拍卖的数据结构清晰（有“即决价格”和“竞拍”区分），适合捡漏逻辑。PayPay 相对较新，竞争略小于 Mercari。
    *   **次选：** **Mercari**。
        *   理由：虽然流量最大，但开发和维护爬虫的成本最高。建议在 MVP 验证跑通后再接入。

---

## 2. 系统架构设计 (System Architecture Design)

为了保证系统的可扩展性和高可用性，建议采用 **微服务化 (Microservices)** 或 **模块化单体 (Modular Monolith)** 架构。

### 2.1 技术栈选型

*   **Backend (后端):** **Node.js (NestJS)**
    *   *理由：* NestJS 提供了优秀的 TypeScript 支持、依赖注入和模块化结构，适合复杂的企业级应用。相比 Express，它更规范，利于多人协作和后期维护。
*   **Database (数据库):**
    *   **PostgreSQL:** 主数据库。存储用户数据、监控规则、商品元数据 (Transactional Data)。
    *   **Redis:** 缓存与消息队列。用于 BullMQ (任务队列) 和缓存热点数据。
*   **Search Engine (可选):** **ElasticSearch** 或 **MeiliSearch**
    *   *理由：* 如果 MVP 阶段数据量不大（< 100万条），Postgres 的全文检索足矣。如果进入 Phase 2 做全量趋势分析，必须引入 ES 来处理聚合查询和全文检索。
*   **Crawler (爬虫核心):** **Playwright** + **TypeScript**
    *   *理由：* Playwright 比 Puppeteer 更现代化，抗指纹能力更强。
    *   *辅助工具：* `playwright-extra` + `stealth-plugin` (必选)，以及第三方验证码解决服务 (如 2Captcha，如果遇到验证码)。
*   **Frontend (前端):** **React (Next.js)** + **Ant Design / Tailwind CSS**
    *   *理由：* Next.js 适合构建管理后台和数据看板，SEO友好且性能优秀。

### 2.2 架构图解 (Conceptual Diagram)

```mermaid
graph TD
    User[用户 (Petter)] -->|配置规则/查看看板| WebUI[Web Dashboard (Next.js)]
    WebUI -->|API 请求| APIGateway[API Service (NestJS)]
    
    APIGateway -->|读写规则| DB[(PostgreSQL)]
    APIGateway -->|添加监控任务| Queue[Redis Task Queue (BullMQ)]
    
    subgraph Crawler Cluster [爬虫集群]
        Worker1[Worker Node]
        Worker2[Worker Node]
        Proxy[住宅代理池 (Rotating Proxies)]
    end
    
    Queue -->|分发任务| Worker1
    Queue -->|分发任务| Worker2
    
    Worker1 -->|HTTP/Browser| Mercari[Mercari]
    Worker1 -->|HTTP/Browser| Yahoo[Yahoo Auctions]
    Worker1 -- 使用 --> Proxy
    
    Worker1 -->|发现新商品| Analyzer[分析引擎]
    Analyzer -->|符合捡漏规则| Notifier[通知服务 (Discord/Line/Email)]
    Analyzer -->|存储历史数据| DB
```

### 2.3 关键模块设计

1.  **任务调度 (Scheduler):**
    *   利用 Redis 实现**分布式队列**。
    *   **Cron Job:** 每 5 分钟触发一次“扫描任务”。
    *   **Priority Queue:** 对于“高意向”关键词，频率提升至 1 分钟/次；普通关键词 10 分钟/次。

2.  **反爬对抗层 (Anti-Scraping Layer):**
    *   **指纹伪造:** 随机 User-Agent, Screen Resolution, WebGL Vendor。
    *   **流量控制:** 单个 IP 请求间隔增加随机抖动 (Jitter)。
    *   **API 逆向 (高级):** 尝试抓取 Mobile App 的 API 接口（通常返回 JSON），比解析 HTML 更快更稳，但需要破解签名算法（难度高）。建议 MVP 阶段先用 Web 抓取。

---

## 3. 功能规划与路线图 (Features & Roadmap)

### Phase 1: MVP - 核心捡漏 (The Sniper)
**目标：** 实现单一平台（如 PayPay Flea Market）的关键词实时监控与通知。

*   **功能：**
    *   **规则配置：** 用户输入关键词（如 "RTX 3080"）、价格区间（< 50,000 JPY）、排除关键词（"Junk", "坏"）。
    *   **爬虫执行：** 每 X 分钟扫描一次搜索结果页的 "New Arrival" (新着顺)。
    *   **实时比价：** 简单的逻辑判断（当前价格 < 设定价格）。
    *   **报警推送：** 通过 Discord Webhook 或 Telegram Bot 推送商品链接和图片。
*   **交付物：** 一个简单的 Web 后台 + 稳定运行的后端爬虫。

### Phase 2: 趋势分析与多平台 (The Analyst)
**目标：** 接入 Mercari/Yahoo，并开始积累数据进行趋势分析。

*   **功能：**
    *   **多平台聚合：** 同时搜索四个平台，统一展示在一个列表中。
    *   **每日 Top 榜单：** 针对特定类目（由用户指定），统计过去 24 小时“Sold”状态商品的均价和销量。
    *   **价格波动报警：** "过去 7 天均价为 5000，今日突降至 3000" -> 触发报警。
    *   **数据可视化：** 价格走势图 (ECharts/Recharts)。

### Phase 3: 自动化与高级功能 (The Trader)
**目标：** 辅助决策甚至自动交易。

*   **功能：**
    *   **利润计算器：** 输入商品价格和预估售价，自动扣除平台手续费（Mercari 10%）、日本国内运费、国际运费，计算预估净利。
    *   **自动购买 (Auto-Buy Bot):** **(高风险)** 集成账号 Cookie，当满足极低价格时自动下单。*注：涉及支付安全和账号风控，需极为谨慎。*
    *   **以图搜图：** 集成 Vision API，发现标题未写明但图片是目标商品的“漏网之鱼”。

---

## 4. 总结 (Executive Summary)

*   **技术路线：** Node.js (NestJS) + Playwright 是最稳健的选择。
*   **最大挑战：** Mercari 的反爬虫机制。建议预算中包含**付费代理服务 (Proxy Service)** 的成本。
*   **起步策略：** **从 PayPay Flea Market 或 Yahoo Auctions 切入**，验证捡漏逻辑，再逐步攻克 Mercari。

请确认是否基于此架构进行 MVP 开发，或者对特定平台有优先级调整。
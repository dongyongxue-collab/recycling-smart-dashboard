# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-06-12
- Primary product surfaces: Web dashboard, GitHub repository landing page, SVG repository cover, local launcher experience.
- Evidence reviewed: `src/App.tsx`, `src/index.css`, `server/recycling-config.ts`, `README.md`, `docs/repo-cover.svg`, `public/` icon assets.

## Brand
- Personality: 专业、冷静、数据密集、有行业研究深度；像“行情终端 + 产业研究杂志”，不是普通后台模板。
- Trust signals: 明确数据来源、报价口径、法规层级、快照兜底、更新时间和限制说明。
- Avoid: 过度炫光、廉价赛博风、纯装饰动效、无来源的绝对化实时承诺、把新闻和报价混成一团。

## Product goals
- Goals: 帮助使用者快速查看再生资源各品类回收价、区域热度、新闻异动、法规标准、工艺流程和趋势。
- Non-goals: 不做交易系统、不绕过付费墙、不承诺交易级实时行情、不代替官方法规文本。
- Success signals: 一屏内先看到价格和趋势；每个品类有清晰细分；法规与工艺能对应当前品类；数据为空时有兜底与解释。

## Personas and jobs
- Primary personas: 再生资源从业者、打包站/回收站经营者、贸易观察者、行业研究人员、企业内部信息整理者。
- User jobs: 快速判断某品类是否有行情变化；查看不同地区报价；理解某类资源回收处理流程；核对法规或标准依据。
- Key contexts of use: 桌面大屏长期查看、手机临时查看、办公室局域网、自有域名线上访问。

## Information architecture
- Primary navigation: 大类导航优先；品类详情内分为报价、资讯、工艺法规三层。
- Core routes/screens: 首页总览、地图热力、全局新闻、分类导航、品类详情、报价表、法规工艺卡片。
- Content hierarchy: 价格 > 区域 > 趋势 > 新闻 > 法规 > 工艺 > 行业痛点。

## Design principles
- Principle 1: 行情优先。任何装饰都不能压过报价、时间、地区、来源。
- Principle 2: 分层阅读。全局新闻和品类新闻分开，通用法规和品类法规分开。
- Principle 3: 专业克制。动效用于强调实时变化和悬浮信息，不做无意义炫技。
- Tradeoffs: 数据密度高于留白感，但必须通过卡片、标签、色彩和版面节奏控制可读性。

## Visual language
- Color: 深海蓝黑为底，青蓝和薄荷绿作为实时与可信信号，少量琥珀色用于风险或提示。
- Typography: 中文优先清晰稳重，英文用于专业副标题和标签；标题要有杂志封面感，正文保持扫描效率。
- Spacing/layout rhythm: 大模块之间保持强边界，小模块内部高密度排列；避免大面积空白。
- Shape/radius/elevation: 玻璃质感卡片、细线边框、柔和阴影，圆角控制在专业范围内。
- Motion: 仅用于价格滚动、地图点位、悬浮解释、卡片进入和焦点状态。
- Imagery/iconography: 使用科技观测、环形镜头、地图热区、行情曲线等隐喻；图标保持线性、克制、同一粗细。

## Components
- Existing components to reuse: KPI cards, news ribbon, map heat section, category sidebar, quote table, regulation cards, process flow cards.
- New/changed components: Repository cover SVG, README bilingual editorial sections, design source of truth.
- Variants and states: Loading, snapshot fallback, live, stale, empty, hover, selected category, selected map point.
- Token/component ownership: CSS variables in `src/index.css`; repository presentation assets in `docs/`.

## Accessibility
- Target standard: Practical WCAG AA contrast for key text and controls.
- Keyboard/focus behavior: Interactive filters, category items, quote rows and map points need visible focus states.
- Contrast/readability: Dark background must preserve legibility for price, time, and source.
- Screen-reader semantics: Data tables should keep semantic table structure where possible.
- Reduced motion and sensory considerations: Future motion should respect reduced-motion settings for long-running dashboard use.

## Responsive behavior
- Supported breakpoints/devices: Desktop dashboard first, but mobile must support quick quote/news lookup.
- Layout adaptations: Dense multi-column layout collapses into single-column cards; map and quote table should remain readable.
- Touch/hover differences: Hover tooltips need tap alternatives on mobile.

## Interaction states
- Loading: Show live/snapshot state and avoid blank panels.
- Empty: Explain whether no quote was found, source failed, or category has only knowledge content.
- Error: Preserve last known snapshot and clearly show refresh failure.
- Success: Show fetched time, source count, and live indicator.
- Disabled: Muted contrast but still readable.
- Offline/slow network: Fall back to bootstrap snapshot and mark data freshness.

## Content voice
- Tone: 专业、直接、可核查；像行业研究简报，不像营销软文。
- Terminology: 使用“回收价、报价口径、品类、细分品类、法规标准、官方动态、趋势参考”。
- Microcopy rules: 任何数据限制必须说清楚；不要写“绝对实时”“权威唯一”等无法保证的表述。

## Implementation constraints
- Framework/styling system: React + TypeScript + Vite; plain CSS variables and component classes.
- Design-token constraints: Keep current dark glass system; do not introduce unrelated UI kits.
- Performance constraints: Long-running dashboard should avoid heavy animations and excessive network polling.
- Compatibility constraints: Chrome desktop/mobile; GitHub README rendering; Windows local launcher.
- Test/screenshot expectations: Run build after presentation changes; visually verify cover if SVG structure changes.

## Open questions
- [ ] 是否需要正式接入授权数据源，替代公开网页抓取的不稳定性。
- [ ] 是否需要为手机端单独设计“只看报价”的轻量模式。
- [ ] 是否需要为 GitHub Pages 或服务器部署输出静态演示版本。

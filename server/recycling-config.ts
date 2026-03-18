import type { CategoryDefinition, RegulationItem } from './types.js';

const SOLID_WASTE_LAW: RegulationItem = {
  title: '中华人民共和国固体废物污染环境防治法',
  authority: '全国人大常委会',
  referenceUrl: 'https://www.gov.cn/xinwen/2020-04/30/content_5507561.htm',
  publishedDate: '2020-04-29',
  status: '现行有效',
  docType: '法律',
};

const RECYCLING_MEASURE: RegulationItem = {
  title: '再生资源回收管理办法',
  authority: '商务部',
  referenceUrl: 'https://www.gov.cn/gongbao/content/2007/content_721184.htm',
  publishedDate: '2007-05',
  status: '现行有效',
  docType: '办法',
};

const HAZARDOUS_TRANSFER: RegulationItem = {
  title: '危险废物转移管理办法',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk02/202111/t20211130_962150.html',
  publishedDate: '2021-11-30',
  status: '现行有效',
  docType: '办法',
};

const SCRAP_STEEL_GUIDE: RegulationItem = {
  title: '加强废钢铁加工行业规范管理 推动钢铁行业绿色高质量发展',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/jgsj/jns/gzdt/art/2024/art_c312348475c6498e8f3a84d4b6f5a058.html',
};

const COPPER_ALUMINUM_GUIDE: RegulationItem = {
  title: '首批符合《废铜铝加工利用行业规范条件》企业名单发布',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/jgsj/jns/gzdt/art/2024/art_f830c847b82740a98d8a9eddb975fe74.html',
};

const WASTE_PLASTIC_GUIDE: RegulationItem = {
  title: '绿色转型，质效双升：废塑料规范企业树立行业新标杆',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/jgsj/jns/gzdt/art/2024/art_9fd8c22ce264428ab312857fe328e3dc.html',
};

const WASTE_PAPER_GUIDE: RegulationItem = {
  title: '《废纸加工行业规范条件》实施三年 行业规范发展成效显著',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/jgsj/jns/zhlyh/art/2024/art_9011cc395c0f460090e0c36803772ae9.html',
};

const WASTE_GLASS_STANDARD: RegulationItem = {
  title: '玻璃工业大气污染防治可行技术指南',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/dqhjbh/dqgdwrywrwpfbz/202601/t20260129_1142888.shtml',
};

const POWER_BATTERY_GUIDE: RegulationItem = {
  title: '《新能源汽车废旧动力电池综合利用行业规范条件（2024年本）》解读',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/zwgk/zcjd/art/2024/art_a2042b19234045b5881e7123f46a8d06.html',
};

const SCRAPPED_VEHICLE_ENV_STANDARD: RegulationItem = {
  title: '报废机动车拆解企业污染控制技术规范（HJ 348-2022）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202207/t20220722_989474.html',
};

const SCRAPPED_VEHICLE_TECH_STANDARD: RegulationItem = {
  title: '报废机动车回收拆解企业技术规范（GB22128）',
  authority: '商务主管部门公开标准解读',
  referenceUrl: 'https://zcom.zj.gov.cn/art/2019/12/31/art_1403427_41403438.html',
};

const E_WASTE_LICENSE: RegulationItem = {
  title: '废弃电器电子产品处理资格许可管理办法',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/gzk/gz/202112/t20211210_963734.shtml',
};

const E_WASTE_FUND_NOTICE: RegulationItem = {
  title: '关于废弃电器电子产品处理专项资金申请企业标准和条件的通知',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk04/202502/t20250213_1102236.html',
};

const WASTE_TEXTILE_STANDARD: RegulationItem = {
  title: '废旧织物回收及综合利用规范',
  authority: '深圳市市场监管部门政策解读',
  referenceUrl: 'https://www.sz.gov.cn/zfgb/zcjd/content/post_4978963.html',
};

const WASTE_RUBBER_GUIDE: RegulationItem = {
  title: '解读《废旧轮胎综合利用行业规范条件》',
  authority: '工信部',
  referenceUrl: 'https://www.miit.gov.cn/jgsj/jns/zyjy/art/2020/art_832784e7b19248c7bc49aa4e1844e29f.html',
};

const WASTE_WOOD_GUIDE: RegulationItem = {
  title: '木材剩余物基质化利用助力绿色循环发展',
  authority: '福建省林业局',
  referenceUrl: 'https://lyj.fujian.gov.cn/zwgk/hygl/202507/t20250714_6967107.htm',
};

const KITCHEN_GREASE_OPINION: RegulationItem = {
  title: '国务院办公厅关于加强地沟油整治和餐厨废弃物管理的意见',
  authority: '国务院办公厅',
  referenceUrl: 'https://www.mee.gov.cn/zcwj/gwywj/201811/t20181129_676494.shtml',
};

const INDUSTRIAL_SLAG_GUIDE: RegulationItem = {
  title: '一般工业固体废物规范化环境管理指南（征求意见稿）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk06/202407/t20240725_1082448.html',
};

const MUNICIPAL_WASTE_PLAN: RegulationItem = {
  title: '国务院办公厅转发国家发展改革委住房城乡建设部生活垃圾分类制度实施方案的通知',
  authority: '国务院办公厅',
  referenceUrl: 'https://www.nhc.gov.cn/bgt/gwywj2/201703/8201a29abb7a442390c30a0056612c18.shtml',
};

const CONSTRUCTION_WASTE_OPINION: RegulationItem = {
  title: '国务院办公厅转发住房城乡建设部《关于进一步加强城市建筑垃圾治理的意见》的通知',
  authority: '国务院办公厅',
  referenceUrl: 'https://www.gov.cn/zhengce/content/202506/content_7027026.htm',
};

const HAZARDOUS_WASTE_LICENSE: RegulationItem = {
  title: '危险废物经营许可证管理办法',
  authority: '国务院',
  referenceUrl: 'https://www.gov.cn/gongbao/content/2016/content_5139367.htm',
  publishedDate: '2016-02',
  status: '现行有效',
  docType: '办法',
};

const HAZARDOUS_WASTE_LIST: RegulationItem = {
  title: '国家危险废物名录（2025年版）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/xxgk2018/xxgk/xxgk01/202501/t20250120_1100287.html',
  publishedDate: '2025-01-20',
  status: '现行有效',
  docType: '名录',
};

const HAZARDOUS_STORAGE_STANDARD: RegulationItem = {
  title: '危险废物贮存污染控制标准（GB 18597-2023）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/other/qt/202308/t20230824_1039320.shtml',
  publishedDate: '2023-08-24',
  status: '现行有效',
  docType: '国标',
};

const MEDICAL_WASTE_ORDINANCE: RegulationItem = {
  title: '医疗废物管理条例',
  authority: '国务院',
  referenceUrl: 'https://www.nhc.gov.cn/fzs/s3576/200804/fe983d6a8c7b4c8b8ca284b8af31e01e.shtml',
  publishedDate: '2003-06',
  status: '现行有效',
  docType: '条例',
};

const MEDICAL_WASTE_MEASURE: RegulationItem = {
  title: '医疗卫生机构医疗废物管理办法',
  authority: '国家卫生健康委',
  referenceUrl: 'https://www.nhc.gov.cn/fzs/c100048/201808/e1f12130a00248558abaea83c77719d0.shtml',
  publishedDate: '2018-08',
  status: '现行有效',
  docType: '办法',
};

const MEDICAL_WASTE_DIRECTORY: RegulationItem = {
  title: '医疗废物分类目录（2021年版）',
  authority: '国家卫生健康委',
  referenceUrl: 'https://www.nhc.gov.cn/wjw/c100175/202112/cbfa50d4a049466586741e2d6de55d92.shtml',
  publishedDate: '2021-12',
  status: '现行有效',
  docType: '目录',
};

const MEDICAL_WASTE_POLLUTION_STANDARD: RegulationItem = {
  title: '医疗废物处理处置污染控制标准（GB 39707-2020）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/gthw/gtfwwrkzbz/202012/t20201218_813930.shtml',
  publishedDate: '2020-12-18',
  status: '现行有效',
  docType: '国标',
};

const MEDICAL_WASTE_PACKAGING_STANDARD: RegulationItem = {
  title: '医疗废物专用包装袋、容器和警示标志标准（HJ 421-2008）',
  authority: '生态环境部',
  referenceUrl: 'https://www.mee.gov.cn/ywgz/fgbz/bz/bzwb/gthw/qtxgbz/200803/t20080306_119048.htm',
  publishedDate: '2008-03-06',
  status: '现行有效',
  docType: '行标',
};

const MEDICAL_WASTE_GOVERNANCE_PLAN: RegulationItem = {
  title: '医疗机构废弃物综合治理工作方案',
  authority: '国家卫生健康委等10部门',
  referenceUrl: 'https://www.nhc.gov.cn/yzygj/c100067/202002/66036c7db7b3410d8ebbc4cb7f80ff97.shtml',
  publishedDate: '2020-02',
  status: '现行有效',
  docType: '方案',
};

export const COMMON_REGULATIONS: RegulationItem[] = [SOLID_WASTE_LAW, RECYCLING_MEASURE];

export const CITY_PRIORITY = '天津';

const CATEGORY_PAIN_POINTS: Record<string, string[]> = {
  'scrap-steel': [
    '钢厂到厂价、基地收购价和社会面流通价分层明显，单一报价难反映真实成交区间。',
    '轻薄料、压块料和工地料扣杂标准不一，验货后价差波动大。',
    '物流半径和装卸效率直接吞噬毛利，跨区域调货对时效和现金流要求高。',
  ],
  'scrap-copper': [
    '品位判定高度依赖现场拆解和经验，光亮铜、杂铜、黄铜之间的价差极易被误判。',
    '线缆剥离、损耗和税票处理影响最终净价，公开报价通常低于可落地成交价。',
    '国际铜价、汇率和下游铜杆订单联动紧，回收端容易出现高波动低锁价的问题。',
  ],
  'scrap-aluminum': [
    '生铝、熟铝、铝合金和铝屑的杂质控制标准差异大，来料一旦混级就会压价。',
    '除漆、除铁和熔损率直接决定利润，很多公开价格未体现加工损耗。',
    '再生铝下游需求受汽车、建筑和家电订单影响明显，回收端波动具有周期性。',
  ],
  'waste-plastic': [
    '同样是塑料，颜色、树脂牌号、洁净度和含水率都会让回收价产生明显分层。',
    '清洗、热洗、造粒能耗高，低端料在电价和人工上涨时容易出现倒挂。',
    '再生料销售受原油和新料价格挤压，公开回收价与终端成交价经常不同步。',
  ],
  'waste-paper': [
    'AA级、A级、统货和花纸边等级边界并不统一，纸厂扣点口径差异很大。',
    '纸厂调价频繁，回收站库存一旦压货，单日价差就可能迅速放大。',
    '含水率、杂质率和打包密度直接影响到厂结算，公开参考价不等于最终回款价。',
  ],
  'waste-glass': [
    '白料、青料和杂色料价格差异大，但前端分色回收难度高，常导致混级降价。',
    '运输成本在玻璃回收中占比偏高，低值料跨区域流动空间有限。',
    '下游窑炉和建材企业对粒径、洁净度要求高，分拣不达标会导致整车退货。',
  ],
  'power-battery': [
    '包级、模组级和黑粉级报价逻辑不同，公开价格往往只反映局部环节。',
    '安全放电、拆解资质和危废转运合规门槛高，回收端不是简单比吨价。',
    '镍钴锂价格波动会快速传导到电池回收端，库存和账期风险都比较高。',
  ],
  'scrapped-vehicle': [
    '整车收购价、五大总成残值和废钢残值叠加，定价模型比普通废钢复杂得多。',
    '注销、拆解、危废处理和零部件流向管理要求严格，合规成本高。',
    '拆解件流通节奏慢、占用场地大，现金回笼周期通常长于其他再生品类。',
  ],
  'e-waste': [
    '电子废弃物品类极杂，板卡、家电和通信设备的估值逻辑完全不同。',
    '贵金属回收价值高，但拆解和环保要求也高，非标准操作容易形成损耗。',
    '回收端普遍存在信息不透明问题，同品类因成色和型号不同价差极大。',
  ],
  'waste-textile': [
    '旧衣、棉布、化纤和工业边角料流向不同，混装会直接降低分拣价值。',
    '分拣人工依赖度高，成色和材质识别标准难完全标准化。',
    '可再穿戴流通、再生纤维和终端消纳渠道不稳定，导致库存周转慢。',
  ],
  'waste-rubber': [
    '废轮胎、胶块、橡胶粉和热解料价值链不同，前端回收很难统一计价。',
    '钢丝分离、纤维去除和粒径控制成本高，很多报价未反映加工深度差异。',
    '下游再生胶、改性料和燃料市场波动大，回收端利润空间易被压缩。',
  ],
  'waste-wood': [
    '木托盘、模板木和混合木料品质差异大，水分和含钉率直接影响成交价。',
    '前端拆钉、去杂和破碎成本高，低值木料很容易被物流吃掉利润。',
    '板材厂、生物质厂和园林终端需求并不稳定，价格弹性有限。',
  ],
  'kitchen-grease': [
    '餐厨废油和固形厨余回收逻辑不同，混收会影响精炼效率和结算口径。',
    '收运合规、台账管理和流向监管严格，回收商运营门槛高。',
    '油脂酸价、水分和杂质含量波动大，公开报价很难完全反映真实质量差异。',
  ],
  'industrial-slag': [
    '工业废渣危险属性和可利用属性需要先判断，不同来源处理路径差异大。',
    '检测、稳定化和资源化加工投入高，价格不仅看吨位还看处置难度。',
    '终端消纳依赖建材和道路工程项目，需求释放往往带有明显项目周期。',
  ],
  'hazardous-waste': [
    '危废并不是简单按重量计价，处置类别、热值、含水率和危害代码都会显著影响单吨价值。',
    '跨省转移、经营许可和联单管理要求严格，任何合规缺口都会直接影响接单能力。',
    '资源化危废和无害化处置危废的商业模式完全不同，公开报价往往只反映局部环节。',
  ],
  'medical-waste': [
    '医疗废弃物虽然纳入危废监管体系，但医院、疾控、实验室和宠物诊疗机构的收集口径差异很大，单一报价难反映真实处置成本。',
    '感染性、损伤性、病理性、药物性和化学性废物必须分流，任何混装都会抬高收运和末端处置风险。',
    '回收端本质上更接近“收运处置服务”，合规台账、冷链/专车转运和应急能力往往比单吨价格更关键。',
  ],
  'municipal-solid-waste': [
    '生活垃圾中的可回收物价值被分拣效率决定，前端分类质量直接影响回收价。',
    '低值可回收物运费和人工占比高，很多场景只能靠规模化摊薄成本。',
    '各城市分类标准和回收体系差异大，全国价格参考的可比性并不强。',
  ],
  'construction-waste': [
    '建筑垃圾含土率、轻物质比例和粒径差异大，再生骨料定价标准不完全统一。',
    '现场分类不到位会抬高后端破碎筛分成本，直接压缩处置利润。',
    '再生骨料终端接受度和项目招标政策密切相关，价格受政策驱动明显。',
  ],
};

const BASE_RECYCLING_CATEGORIES: Array<Omit<CategoryDefinition, 'painPoints'>> = [
  {
    id: 'scrap-steel',
    name: '废钢',
    subcategories: ['重废', '中废', '轻薄料', '钢筋压块', '工地料'],
    searchKeyword: '废钢 回收',
    quoteKeywords: ['废钢', '废铁', '钢筋头', '钢板边角料', '工地料', '重废'],
    newsKeywordsCn: ['废钢', '废铁', '钢厂调价', '螺纹', '钢材'],
    newsKeywordsEn: ['scrap steel', 'ferrous scrap', 'steel recycling'],
    costStructure: [
      { label: '收购价', percent: 72 },
      { label: '分拣与加工', percent: 10 },
      { label: '运输', percent: 12 },
      { label: '损耗与管理', percent: 6 },
    ],
    processFlow: [
      { step: 1, title: '回收集货', description: '回收站按重废、中废、轻薄料分级收货。' },
      { step: 2, title: '预处理', description: '去杂、剪切、打包，形成钢厂可接收料型。' },
      { step: 3, title: '物流进厂', description: '按到厂标准过磅、质检、扣杂。' },
      { step: 4, title: '熔炼再生', description: '进入电炉/转炉配料，形成再生钢原料。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, SCRAP_STEEL_GUIDE],
  },
  {
    id: 'scrap-copper',
    name: '废铜',
    subcategories: ['1#光亮铜', '2#铜', '黄铜', '铜米', '杂铜'],
    searchKeyword: '废铜 回收',
    quoteKeywords: ['废铜', '紫铜', '黄铜', '铜米', '电缆铜'],
    newsKeywordsCn: ['废铜', '铜价', '铜杆', '再生铜'],
    newsKeywordsEn: ['scrap copper', 'copper recycling', 'copper scrap'],
    costStructure: [
      { label: '收购价', percent: 78 },
      { label: '拆解剥离', percent: 9 },
      { label: '运输', percent: 8 },
      { label: '损耗与税费', percent: 5 },
    ],
    processFlow: [
      { step: 1, title: '分选定级', description: '按光亮铜、杂铜、黄铜等品级分流。' },
      { step: 2, title: '破碎剥离', description: '电缆线类进行破碎与物理分选。' },
      { step: 3, title: '精炼处理', description: '除杂后进入再生铜冶炼环节。' },
      { step: 4, title: '再生利用', description: '输出再生铜杆、铜锭等产品。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, COPPER_ALUMINUM_GUIDE],
  },
  {
    id: 'scrap-aluminum',
    name: '废铝',
    subcategories: ['机生铝', '熟铝', '铝合金', '易拉罐铝', '铝屑'],
    searchKeyword: '废铝 回收',
    quoteKeywords: ['废铝', '工业铝', '铝合金', '生铝', '熟铝', '铝屑'],
    newsKeywordsCn: ['废铝', '铝价', '再生铝'],
    newsKeywordsEn: ['scrap aluminum', 'aluminium recycling', 'secondary aluminum'],
    costStructure: [
      { label: '收购价', percent: 75 },
      { label: '预处理', percent: 11 },
      { label: '运输', percent: 9 },
      { label: '能耗与管理', percent: 5 },
    ],
    processFlow: [
      { step: 1, title: '来料验级', description: '按型材、压铸、易拉罐等类别收料。' },
      { step: 2, title: '破碎除杂', description: '去漆、去铁及杂质分离。' },
      { step: 3, title: '熔炼合金化', description: '按牌号进行配比熔炼。' },
      { step: 4, title: '铸锭/再加工', description: '形成再生铝锭和再加工材料。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, COPPER_ALUMINUM_GUIDE],
  },
  {
    id: 'waste-plastic',
    name: '废塑料',
    subcategories: ['PET瓶片', 'PP再生料', 'PE再生料', 'ABS再生料', '混合塑料'],
    searchKeyword: '废塑料 回收',
    quoteKeywords: ['废塑料', '再生塑料', '塑料', 'PET', 'PP', 'PE', 'ABS', '瓶片'],
    newsKeywordsCn: ['废塑料', '再生塑料', '瓶片', '再生料'],
    newsKeywordsEn: ['waste plastic', 'plastic recycling', 'recycled polymer'],
    costStructure: [
      { label: '收购价', percent: 62 },
      { label: '清洗分选', percent: 16 },
      { label: '造粒加工', percent: 14 },
      { label: '物流与损耗', percent: 8 },
    ],
    processFlow: [
      { step: 1, title: '分类收集', description: '按树脂种类和颜色进行分拣。' },
      { step: 2, title: '清洗破碎', description: '去标、去杂、破碎和热洗。' },
      { step: 3, title: '熔融造粒', description: '挤出、过滤、切粒形成再生颗粒。' },
      { step: 4, title: '改性应用', description: '按下游要求进行改性与配方调整。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_PLASTIC_GUIDE],
  },
  {
    id: 'waste-paper',
    name: '废纸',
    subcategories: ['AA级', 'A级', 'B级', '统货', '花纸边'],
    searchKeyword: '废纸 回收',
    quoteKeywords: ['废纸', '黄板纸', '箱板纸', '书本纸', '纸浆'],
    newsKeywordsCn: ['废纸', '纸厂调价', '黄板纸', '再生纸'],
    newsKeywordsEn: ['waste paper', 'recovered paper', 'paper recycling'],
    costStructure: [
      { label: '收购价', percent: 68 },
      { label: '打包分拣', percent: 12 },
      { label: '物流', percent: 13 },
      { label: '损耗与管理', percent: 7 },
    ],
    processFlow: [
      { step: 1, title: '回收分类', description: '按黄板纸、白纸、报纸等等级分类。' },
      { step: 2, title: '打包运输', description: '压包后进入纸厂到厂体系。' },
      { step: 3, title: '制浆脱墨', description: '碎解、筛选、净化形成再生浆。' },
      { step: 4, title: '抄纸成品', description: '进入瓦楞、箱板等纸机生产线。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_PAPER_GUIDE],
  },
  {
    id: 'waste-glass',
    name: '废玻璃',
    subcategories: ['白料', '青料', '杂色料', '平板玻璃', '玻璃瓶片'],
    searchKeyword: '废玻璃 回收',
    quoteKeywords: ['废玻璃', '玻璃瓶', '碎玻璃', '平板玻璃'],
    newsKeywordsCn: ['废玻璃', '玻璃回收', '再生玻璃'],
    newsKeywordsEn: ['waste glass', 'cullet', 'glass recycling'],
    costStructure: [
      { label: '收购价', percent: 55 },
      { label: '分色分拣', percent: 18 },
      { label: '破碎清洗', percent: 17 },
      { label: '运输', percent: 10 },
    ],
    processFlow: [
      { step: 1, title: '分色回收', description: '按白料、青料、杂色玻璃分选。' },
      { step: 2, title: '除杂破碎', description: '去金属、标签与杂质后破碎。' },
      { step: 3, title: '粒度控制', description: '筛分后形成稳定粒径玻璃砂。' },
      { step: 4, title: '再熔利用', description: '回到玻璃窑炉或建材体系。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_GLASS_STANDARD],
  },
  {
    id: 'power-battery',
    name: '动力电池',
    subcategories: ['磷酸铁锂电池', '三元电池', '模组', '电池黑粉', '电芯壳体'],
    searchKeyword: '动力电池 回收',
    quoteKeywords: ['动力电池', '锂电池', '电池回收', '磷酸铁锂', '三元电池', '黑粉'],
    newsKeywordsCn: ['动力电池', '梯次利用', '电池回收', '电池拆解'],
    newsKeywordsEn: ['power battery recycling', 'lithium battery recycling', 'black mass'],
    costStructure: [
      { label: '收购价', percent: 64 },
      { label: '拆解与放电', percent: 14 },
      { label: '湿法/火法提取', percent: 17 },
      { label: '环保与合规', percent: 5 },
    ],
    processFlow: [
      { step: 1, title: '回收与溯源', description: '按编码追溯来源并做安全入库。' },
      { step: 2, title: '拆解放电', description: '包级/模组级拆解并进行安全放电。' },
      { step: 3, title: '材料提取', description: '通过物理分选与湿法提取有价金属。' },
      { step: 4, title: '梯次或再生', description: '可用电芯梯次利用，其余再生冶炼。' },
    ],
    regulations: [
      SOLID_WASTE_LAW,
      {
        title: '新能源汽车动力蓄电池回收利用管理暂行办法',
        authority: '工信部等七部委',
        referenceUrl: 'https://www.gov.cn/xinwen/2018-02/26/content_5268846.htm',
      },
      HAZARDOUS_TRANSFER,
      POWER_BATTERY_GUIDE,
    ],
  },
  {
    id: 'scrapped-vehicle',
    name: '报废汽车',
    subcategories: ['整车回收', '发动机总成', '前后桥', '车身钢料', '拆车件'],
    searchKeyword: '报废汽车 回收',
    quoteKeywords: ['报废汽车', '报废机动车', '拆车件', '汽车拆解'],
    newsKeywordsCn: ['报废汽车', '报废机动车', '汽车拆解'],
    newsKeywordsEn: ['end-of-life vehicle', 'vehicle dismantling', 'auto recycling'],
    costStructure: [
      { label: '收购价', percent: 70 },
      { label: '拆解工时', percent: 11 },
      { label: '零部件处理', percent: 11 },
      { label: '环保合规', percent: 8 },
    ],
    processFlow: [
      { step: 1, title: '回收登记', description: '车辆注销、验车并完成回收登记。' },
      { step: 2, title: '预处理', description: '排液、拆除危废部件和气囊等。' },
      { step: 3, title: '精细拆解', description: '分类拆件，金属与可用件分流。' },
      { step: 4, title: '资源化利用', description: '钢铁/有色入炉，再制造件流通。' },
    ],
    regulations: [
      SOLID_WASTE_LAW,
      {
        title: '报废机动车回收管理办法',
        authority: '国务院',
        referenceUrl: 'https://www.gov.cn/zhengce/content/2019-05/06/content_5389987.htm',
      },
      RECYCLING_MEASURE,
      SCRAPPED_VEHICLE_ENV_STANDARD,
      SCRAPPED_VEHICLE_TECH_STANDARD,
    ],
  },
  {
    id: 'e-waste',
    name: '电子废弃物',
    subcategories: ['废电路板', '废旧家电', '旧电脑', '旧手机', '电子元件混合料'],
    searchKeyword: '电子废弃物 回收',
    quoteKeywords: ['电子废弃物', '废旧电子', '废旧家电', '线路板', '废电路板', '旧电脑', '旧手机', '电子料'],
    newsKeywordsCn: ['电子废弃物', '废家电', '线路板', '拆解'],
    newsKeywordsEn: ['e-waste', 'waste electronics', 'pcb recycling'],
    costStructure: [
      { label: '收购价', percent: 58 },
      { label: '拆解分选', percent: 18 },
      { label: '金属提炼', percent: 16 },
      { label: '危废处理', percent: 8 },
    ],
    processFlow: [
      { step: 1, title: '分类收运', description: '按家电、通讯、板卡等门类收集。' },
      { step: 2, title: '人工拆解', description: '拆下高价值元器件与危险部件。' },
      { step: 3, title: '破碎分选', description: '磁选、涡电流和密度分选金属。' },
      { step: 4, title: '冶炼再生', description: '贵金属、有色金属进入再生链条。' },
    ],
    regulations: [
      SOLID_WASTE_LAW,
      {
        title: '废弃电器电子产品回收处理管理条例',
        authority: '国务院',
        referenceUrl: 'https://www.gov.cn/zwgk/2011-02/25/content_1815473.htm',
      },
      HAZARDOUS_TRANSFER,
      E_WASTE_LICENSE,
      E_WASTE_FUND_NOTICE,
    ],
  },
  {
    id: 'waste-textile',
    name: '废旧纺织品',
    subcategories: ['旧衣', '棉布料', '化纤料', '牛仔料', '毛纺料'],
    searchKeyword: '废旧纺织品 回收',
    quoteKeywords: ['废旧纺织品', '旧衣服', '旧衣', '废布料', '纺织下脚料'],
    newsKeywordsCn: ['废旧纺织品', '旧衣回收', '纺织回收'],
    newsKeywordsEn: ['textile recycling', 'used clothing', 'fabric waste'],
    costStructure: [
      { label: '收购价', percent: 60 },
      { label: '分拣人工', percent: 20 },
      { label: '清洗/消毒', percent: 12 },
      { label: '物流', percent: 8 },
    ],
    processFlow: [
      { step: 1, title: '前端回收', description: '社区与企业端旧纺织品集中收集。' },
      { step: 2, title: '分级分拣', description: '按成色、材质与用途进行分级。' },
      { step: 3, title: '再制造', description: '可穿戴品复用，不可穿戴品开松再生。' },
      { step: 4, title: '终端利用', description: '进入再生纤维、保温材料等场景。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_TEXTILE_STANDARD],
  },
  {
    id: 'waste-rubber',
    name: '废橡胶',
    subcategories: ['废轮胎', '橡胶块', '橡胶粉', '丁基胶', '三元乙丙胶'],
    searchKeyword: '废橡胶 回收',
    quoteKeywords: ['废橡胶', '废轮胎', '轮胎', '橡胶粉', '胶块'],
    newsKeywordsCn: ['废橡胶', '废轮胎', '再生胶'],
    newsKeywordsEn: ['scrap rubber', 'tire recycling', 'crumb rubber'],
    costStructure: [
      { label: '收购价', percent: 63 },
      { label: '切块钢丝分离', percent: 16 },
      { label: '粉碎与筛分', percent: 14 },
      { label: '物流', percent: 7 },
    ],
    processFlow: [
      { step: 1, title: '回收集货', description: '轮胎和橡胶边角料分类收运。' },
      { step: 2, title: '预处理', description: '切块并进行钢丝和纤维分离。' },
      { step: 3, title: '深加工', description: '制备橡胶粉、再生胶或热解料。' },
      { step: 4, title: '下游应用', description: '路面材料、橡胶制品与燃料利用。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_RUBBER_GUIDE],
  },
  {
    id: 'waste-wood',
    name: '废木材',
    subcategories: ['废木托盘', '模板木', '锯末', '木片', '混合木料'],
    searchKeyword: '废木材 回收',
    quoteKeywords: ['废木材', '木托盘', '木方', '废旧木料'],
    newsKeywordsCn: ['废木材', '木托盘回收', '生物质'],
    newsKeywordsEn: ['waste wood', 'wood recycling', 'biomass waste'],
    costStructure: [
      { label: '收购价', percent: 58 },
      { label: '拆钉分选', percent: 17 },
      { label: '破碎加工', percent: 17 },
      { label: '运输', percent: 8 },
    ],
    processFlow: [
      { step: 1, title: '拆解分类', description: '托盘、模板、家具木料分类。' },
      { step: 2, title: '除杂预处理', description: '去钉去杂，控制含水率。' },
      { step: 3, title: '破碎成料', description: '制备木片、木粉或压块。' },
      { step: 4, title: '资源化利用', description: '用于板材、燃料和园林覆盖物。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, WASTE_WOOD_GUIDE],
  },
  {
    id: 'kitchen-grease',
    name: '厨余/油脂',
    subcategories: ['餐厨废油', '地沟油', '潲水油', '油脂残渣', '餐厨固形物'],
    searchKeyword: '废油脂 回收',
    quoteKeywords: ['厨余', '餐厨废油', '地沟油', '废油脂', '餐厨垃圾', '废食用油', '废油'],
    newsKeywordsCn: ['厨余', '餐厨垃圾', '废油脂', '生物柴油'],
    newsKeywordsEn: ['used cooking oil', 'kitchen waste', 'biodiesel feedstock'],
    costStructure: [
      { label: '收购价', percent: 61 },
      { label: '收运', percent: 15 },
      { label: '预处理提纯', percent: 17 },
      { label: '环保合规', percent: 7 },
    ],
    processFlow: [
      { step: 1, title: '定点回收', description: '餐饮端定点收运和台账管理。' },
      { step: 2, title: '固液分离', description: '去渣、脱水、酸价调节。' },
      { step: 3, title: '精炼转化', description: '制备工业级油脂或生物柴油原料。' },
      { step: 4, title: '终端利用', description: '进入生物燃料和化工体系。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, KITCHEN_GREASE_OPINION],
  },
  {
    id: 'industrial-slag',
    name: '工业废渣',
    subcategories: ['钢渣', '高炉矿渣', '粉煤灰', '有色冶炼渣', '炉底渣'],
    searchKeyword: '工业废渣 回收',
    quoteKeywords: ['工业废渣', '钢渣', '矿渣', '炉渣', '粉煤灰'],
    newsKeywordsCn: ['工业废渣', '钢渣', '粉煤灰', '固废资源化'],
    newsKeywordsEn: ['industrial slag', 'ash recycling', 'solid waste utilization'],
    costStructure: [
      { label: '收购价', percent: 57 },
      { label: '检测与分级', percent: 15 },
      { label: '破碎筛分', percent: 18 },
      { label: '运输', percent: 10 },
    ],
    processFlow: [
      { step: 1, title: '来源核验', description: '核验来源与危险属性判定。' },
      { step: 2, title: '分级处理', description: '按组分和活性进行分级。' },
      { step: 3, title: '加工改性', description: '破碎、筛分、稳定化处理。' },
      { step: 4, title: '建材利用', description: '进入水泥掺合料和道路材料。' },
    ],
    regulations: [SOLID_WASTE_LAW, HAZARDOUS_TRANSFER, RECYCLING_MEASURE, INDUSTRIAL_SLAG_GUIDE],
  },
  {
    id: 'hazardous-waste',
    name: '危险废弃物',
    subcategories: ['废矿物油', '废活性炭', '废酸/废碱', '污泥', '含重金属残渣'],
    searchKeyword: '危险废物 回收',
    quoteKeywords: ['危险废物', '危废', '废矿物油', '废活性炭', '危废处置', '资源化利用'],
    newsKeywordsCn: ['危险废物', '危废', '危废处置', '危险废物资源化'],
    newsKeywordsEn: ['hazardous waste', 'hazardous waste disposal', 'hazardous waste recycling'],
    costStructure: [
      { label: '收购/接收费', percent: 52 },
      { label: '检测分级', percent: 14 },
      { label: '包装转运', percent: 16 },
      { label: '环保合规', percent: 18 },
    ],
    processFlow: [
      { step: 1, title: '来源鉴别', description: '按危废代码、组分和危险特性完成来源鉴别。' },
      { step: 2, title: '分类贮存', description: '按酸碱、油类、污泥和含重金属物料分类暂存。' },
      { step: 3, title: '转运处置', description: '联单转移后进入资源化利用或无害化处置。' },
      { step: 4, title: '闭环留痕', description: '形成经营许可、转移联单和末端去向闭环台账。' },
    ],
    regulations: [
      SOLID_WASTE_LAW,
      HAZARDOUS_TRANSFER,
      HAZARDOUS_WASTE_LICENSE,
      HAZARDOUS_WASTE_LIST,
      HAZARDOUS_STORAGE_STANDARD,
    ],
  },
  {
    id: 'medical-waste',
    name: '医疗废弃物',
    subcategories: ['感染性废物', '损伤性废物', '病理性废物', '药物性废物', '化学性废物'],
    subBoards: [
      {
        name: '感染性废物',
        focus: '重点覆盖被病原体污染的敷料、拭子、一次性耗材和隔离防护用品。',
        handling: '以黄色包装密闭收集，优先走高温焚烧或高温蒸汽灭菌后焚烧协同路线。',
        compliance: '核心关注院感分类、日产日清、专车转运和全过程台账。',
      },
      {
        name: '损伤性废物',
        focus: '主要是针头、刀片、安瓿和其他可能刺伤作业人员的锐器类废物。',
        handling: '必须进入防穿刺专用利器盒，严禁压缩混装，末端以焚烧或破碎灭菌路线处置。',
        compliance: '重点检查利器盒标识、封口状态和转运交接记录。',
      },
      {
        name: '病理性废物',
        focus: '包括组织、器官、胎盘和病理切片等高敏感、高风险废物。',
        handling: '要求独立包装、冷藏暂存或快速转运，优先进入独立焚烧处置环节。',
        compliance: '最看重人员权限、封闭管理和高风险场景下的留痕链路。',
      },
      {
        name: '药物性废物',
        focus: '覆盖过期药品、淘汰制剂、疫苗残余和含药污染物。',
        handling: '按药性和包装形态分类，避免与普通医废混合，必要时走危废协同焚烧。',
        compliance: '需同步满足药监销毁要求与医疗废物联单管理要求。',
      },
      {
        name: '化学性废物',
        focus: '主要是实验室废液、显影液、消毒剂残液及含重金属化学残渣。',
        handling: '先按酸碱、有机溶剂、含汞等属性分流，再决定中和、回收或焚烧处置路径。',
        compliance: '既受医疗废物制度约束，也可能叠加危废代码判定与转移要求。',
      },
    ],
    searchKeyword: '医疗废物 处置',
    quoteKeywords: ['医疗废物', '医废', '医疗垃圾', '感染性废物', '病理性废物', '医疗废弃物处置'],
    newsKeywordsCn: ['医疗废物', '医废', '医疗机构废弃物', '感染性废物', '医废处置'],
    newsKeywordsEn: ['medical waste', 'healthcare waste', 'clinical waste', 'infectious waste'],
    costStructure: [
      { label: '收运/处置费', percent: 58 },
      { label: '分类收集', percent: 12 },
      { label: '专车转运', percent: 14 },
      { label: '焚烧/灭菌与监测', percent: 16 },
    ],
    processFlow: [
      { step: 1, title: '分类收集', description: '院内按感染性、损伤性、病理性、药物性和化学性废物分类收集。' },
      { step: 2, title: '密闭暂存', description: '使用专用包装、周转箱和警示标志，在规定时限内完成密闭暂存。' },
      { step: 3, title: '专车转运', description: '联单留痕、专车专运，进入集中处置设施或应急处置体系。' },
      { step: 4, title: '高温处置', description: '采用焚烧或高温灭菌等工艺，实现无害化处置和全过程监测。' },
    ],
    regulations: [
      SOLID_WASTE_LAW,
      HAZARDOUS_TRANSFER,
      HAZARDOUS_WASTE_LIST,
      MEDICAL_WASTE_ORDINANCE,
      MEDICAL_WASTE_MEASURE,
      MEDICAL_WASTE_DIRECTORY,
      MEDICAL_WASTE_POLLUTION_STANDARD,
      MEDICAL_WASTE_PACKAGING_STANDARD,
      MEDICAL_WASTE_GOVERNANCE_PLAN,
    ],
  },
  {
    id: 'municipal-solid-waste',
    name: '生活垃圾',
    subcategories: ['可回收纸类', '可回收塑料', '可回收金属', '玻璃可回收物', '其他可回收物'],
    searchKeyword: '生活垃圾 回收',
    quoteKeywords: ['生活垃圾', '可回收物', '垃圾分拣', '再生资源分拣'],
    newsKeywordsCn: ['生活垃圾', '垃圾分类', '可回收物'],
    newsKeywordsEn: ['municipal solid waste', 'recyclables sorting', 'waste sorting'],
    costStructure: [
      { label: '分拣后回收价', percent: 54 },
      { label: '分拣人工', percent: 22 },
      { label: '运输', percent: 14 },
      { label: '场站运营', percent: 10 },
    ],
    processFlow: [
      { step: 1, title: '分类投放', description: '居民端完成四分类或多分类投放。' },
      { step: 2, title: '中转分拣', description: '分拣中心提取可回收物。' },
      { step: 3, title: '资源化处理', description: '金属、塑料、纸类进入再生链条。' },
      { step: 4, title: '闭环去向', description: '不可回收部分焚烧或填埋处置。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, MUNICIPAL_WASTE_PLAN],
  },
  {
    id: 'construction-waste',
    name: '建筑废弃物',
    subcategories: ['混凝土块', '砖瓦料', '沥青料', '木质装修料', '轻质混合料'],
    searchKeyword: '建筑废弃物 回收',
    quoteKeywords: ['建筑废弃物', '建筑垃圾', '拆除料', '再生骨料'],
    newsKeywordsCn: ['建筑废弃物', '建筑垃圾', '再生骨料'],
    newsKeywordsEn: ['construction waste', 'demolition waste', 'recycled aggregates'],
    costStructure: [
      { label: '收购价', percent: 50 },
      { label: '分拣破碎', percent: 24 },
      { label: '运输', percent: 16 },
      { label: '场站与设备', percent: 10 },
    ],
    processFlow: [
      { step: 1, title: '现场分类', description: '拆除现场进行土、砖、混凝土分离。' },
      { step: 2, title: '破碎筛分', description: '多级破碎形成再生骨料粒级。' },
      { step: 3, title: '杂质剔除', description: '去除木材、塑料和轻质杂物。' },
      { step: 4, title: '再生应用', description: '用于垫层、再生砖和道路基层。' },
    ],
    regulations: [SOLID_WASTE_LAW, RECYCLING_MEASURE, HAZARDOUS_TRANSFER, CONSTRUCTION_WASTE_OPINION],
  },
];

export const RECYCLING_CATEGORIES: CategoryDefinition[] = BASE_RECYCLING_CATEGORIES.map((category) => ({
  ...category,
  painPoints: CATEGORY_PAIN_POINTS[category.id] ?? [
    '前端报价口径不统一，公开信息与现场成交存在偏差。',
    '物流、分拣和合规成本会持续影响净回收价。',
    '下游需求波动会快速传导到回收端利润。',
  ],
}));

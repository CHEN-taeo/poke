// 测试 DeepSeek 是否接通 + 对比抽取效果。
//   1) 在 .env 填好 LLM_API_KEY
//   2) 运行：npm run test:llm
require('dotenv').config();
const llm = require('./ai/llm');
const pipeline = require('./ai/pipeline');

const CASES = [
  '【讲座】今晚7点三教报告厅，上海交大李教授讲数字孪生在智能制造的应用，签到送学分',
  '有人周六去佘山骑行吗 已经3个人了 还差2个 AA轻松节奏',
  '出一套九成新考研数学全套资料 80块 有意私聊 校内自提',
  '关于2025国家奖学金申请：请于本周四17:00前提交个人陈述至学院教务办',
  '在吗',
  '全国大学生机械创新设计大赛报名截止5月20，想组队的扣1'
];

(async () => {
  console.log('LLM 状态：', llm.enabled() ? '已配置 ✅（走 DeepSeek）' : '未配置 ⚠️（走规则引擎）');
  if (!llm.enabled()) console.log('→ 想测大模型，请在 .env 填 LLM_API_KEY 后重试。\n');
  for (const t of CASES) {
    const it = await pipeline.process(t);
    console.log('\n原始:', t);
    console.log('  →', `[${it.cat}|${it.engine}|${Math.round(it.confidence * 100)}%]`, it.title);
    console.log('   摘要:', it.summary);
    const ex = [it.time && '时间:' + it.time, it.deadline && '截止:' + it.deadline, it.place && '地点:' + it.place, it.price && '价格:' + it.price].filter(Boolean).join('  ');
    if (ex) console.log('  ', ex);
    if (it.tags && it.tags.length) console.log('   标签:', it.tags.join('/'));
  }
  process.exit(0);
})();

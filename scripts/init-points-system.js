/**
 * 积分系统初始化脚本
 * 创建必要的集合和索引
 */

const { initCloudBase } = require('./cloudbase');

const COLLECTIONS = {
  POINTS_LOGS: 'points_logs',
  USER_STREAKS: 'user_streaks',
  POINT_RULES: 'point_rules'
};

// 积分规则配置
const DEFAULT_POINT_RULES = [
  {
    type: 'login',
    name: '每日登录',
    points: 5,
    dailyLimit: 1,
    description: '每日首次登录获得5积分'
  },
  {
    type: 'checkin_fitness',
    name: '健身打卡',
    points: 10,
    dailyLimit: 1,
    description: '每日健身打卡获得10积分'
  },
  {
    type: 'checkin_reading',
    name: '读书打卡',
    points: 10,
    dailyLimit: 1,
    description: '每日读书打卡获得10积分'
  },
  {
    type: 'continuous_3',
    name: '连续3天打卡',
    points: 20,
    description: '连续3天打卡额外获得20积分'
  },
  {
    type: 'continuous_7',
    name: '连续7天打卡',
    points: 50,
    description: '连续7天打卡额外获得50积分'
  },
  {
    type: 'continuous_30',
    name: '连续30天打卡',
    points: 200,
    description: '连续30天打卡额外获得200积分'
  }
];

async function initPointsSystem() {
  console.log('🚀 初始化积分系统...\n');
  
  try {
    const db = await initCloudBase();
    
    // 1. 创建积分记录集合
    console.log('1️⃣ 创建积分记录集合...');
    try {
      await db.createCollection(COLLECTIONS.POINTS_LOGS);
      console.log('   ✅ points_logs 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ points_logs 集合已存在');
      } else {
        throw err;
      }
    }
    
    // 2. 创建连续打卡集合
    console.log('2️⃣ 创建连续打卡集合...');
    try {
      await db.createCollection(COLLECTIONS.USER_STREAKS);
      console.log('   ✅ user_streaks 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ user_streaks 集合已存在');
      } else {
        throw err;
      }
    }
    
    // 3. 创建积分规则集合
    console.log('3️⃣ 创建积分规则集合...');
    try {
      await db.createCollection(COLLECTIONS.POINT_RULES);
      console.log('   ✅ point_rules 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ point_rules 集合已存在');
      } else {
        throw err;
      }
    }
    
    // 4. 初始化积分规则
    console.log('4️⃣ 初始化积分规则...');
    const rulesCollection = db.collection(COLLECTIONS.POINT_RULES);
    
    for (const rule of DEFAULT_POINT_RULES) {
      const existing = await rulesCollection.where({ type: rule.type }).get();
      if (existing.data.length === 0) {
        await rulesCollection.add({
          ...rule,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`   ✅ 规则 "${rule.name}" 已创建`);
      } else {
        console.log(`   ⚠️ 规则 "${rule.name}" 已存在`);
      }
    }
    
    // 5. 创建索引
    console.log('5️⃣ 创建索引...');
    
    // 积分记录索引
    await db.collection(COLLECTIONS.POINTS_LOGS).createIndex({
      userId: 1,
      createdAt: -1
    });
    console.log('   ✅ points_logs.userId 索引创建成功');
    
    await db.collection(COLLECTIONS.POINTS_LOGS).createIndex({
      userId: 1,
      type: 1,
      createdAt: -1
    });
    console.log('   ✅ points_logs.userId_type 索引创建成功');
    
    // 连续打卡索引
    await db.collection(COLLECTIONS.USER_STREAKS).createIndex({
      userId: 1,
      type: 1
    }, { unique: true });
    console.log('   ✅ user_streaks.userId_type 索引创建成功');
    
    console.log('\n✨ 积分系统初始化完成！');
    console.log('\n积分规则:');
    DEFAULT_POINT_RULES.forEach(rule => {
      console.log(`  • ${rule.name}: +${rule.points} 积分`);
    });
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initPointsSystem();
}

module.exports = { initPointsSystem, DEFAULT_POINT_RULES };

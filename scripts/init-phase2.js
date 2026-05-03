/**
 * Phase 2 初始化脚本
 * 创建反馈、验证码等新集合
 */

const { initCloudBase } = require('./cloudbase');

const COLLECTIONS = {
  FEEDBACK: 'feedback',
  VERIFICATION_CODES: 'verification_codes',
  BOOK_RECOMMENDATIONS: 'book_recommendations'
};

// 默认推荐书籍
const DEFAULT_BOOKS = [
  {
    title: '活着',
    author: '余华',
    description: '讲述了农村人福贵悲惨的人生遭遇。涵盖了中国二十世纪下半叶的社会变迁。',
    coverUrl: '',
    tag: '经典文学',
    order: 1,
    isActive: true
  },
  {
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    description: '魔幻现实主义文学的代表作，描写了布恩迪亚家族七代人的传奇故事。',
    coverUrl: '',
    tag: '诺贝尔文学奖',
    order: 2,
    isActive: true
  },
  {
    title: '三体',
    author: '刘慈欣',
    description: '中国科幻文学的里程碑之作，讲述了地球文明与三体文明的博弈。',
    coverUrl: '',
    tag: '科幻巨著',
    order: 3,
    isActive: true
  },
  {
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    description: '从认知革命到科学革命，全景式回顾人类发展历程。',
    coverUrl: '',
    tag: '历史科普',
    order: 4,
    isActive: true
  }
];

async function initPhase2() {
  console.log('🚀 初始化 Phase 2 集合...\n');
  
  try {
    const db = await initCloudBase();
    
    // 1. 创建反馈集合
    console.log('1️⃣ 创建反馈集合...');
    try {
      await db.createCollection(COLLECTIONS.FEEDBACK);
      console.log('   ✅ feedback 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ feedback 集合已存在');
      } else {
        throw err;
      }
    }
    
    // 2. 创建验证码集合
    console.log('2️⃣ 创建验证码集合...');
    try {
      await db.createCollection(COLLECTIONS.VERIFICATION_CODES);
      console.log('   ✅ verification_codes 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ verification_codes 集合已存在');
      } else {
        throw err;
      }
    }
    
    // 3. 创建索引
    console.log('3️⃣ 创建索引...');
    
    // 反馈索引
    await db.collection(COLLECTIONS.FEEDBACK).createIndex({
      userId: 1,
      createdAt: -1
    });
    console.log('   ✅ feedback.userId 索引创建成功');
    
    await db.collection(COLLECTIONS.FEEDBACK).createIndex({
      status: 1
    });
    console.log('   ✅ feedback.status 索引创建成功');
    
    // 验证码索引
    await db.collection(COLLECTIONS.VERIFICATION_CODES).createIndex({
      email: 1,
      purpose: 1
    });
    console.log('   ✅ verification_codes.email_purpose 索引创建成功');
    
    await db.collection(COLLECTIONS.VERIFICATION_CODES).createIndex({
      createdAt: -1
    });
    console.log('   ✅ verification_codes.createdAt 索引创建成功');

    // 4. 创建书籍推荐集合
    console.log('4️⃣ 创建书籍推荐集合...');
    try {
      await db.createCollection(COLLECTIONS.BOOK_RECOMMENDATIONS);
      console.log('   ✅ book_recommendations 集合创建成功');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('   ⚠️ book_recommendations 集合已存在');
      } else {
        throw err;
      }
    }

    // 5. 初始化默认推荐书籍
    console.log('5️⃣ 初始化推荐书籍...');
    const booksCollection = db.collection(COLLECTIONS.BOOK_RECOMMENDATIONS);
    for (const book of DEFAULT_BOOKS) {
      const existing = await booksCollection.where({ title: book.title }).get();
      if (existing.data.length === 0) {
        await booksCollection.add({
          ...book,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        console.log(`   ✅ 书籍 "${book.title}" 已添加`);
      } else {
        console.log(`   ⚠️ 书籍 "${book.title}" 已存在`);
      }
    }
    
    console.log('\n✨ Phase 2 集合初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 执行初始化
if (require.main === module) {
  initPhase2();
}

module.exports = { initPhase2 };

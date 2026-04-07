// utils/util.test.js - 体重管理小程序工具函数测试
const util = require('../util.js');

describe('体重管理小程序 - 工具函数测试', () => {
  
  // ==================== BMI 计算测试 ====================
  describe('calculateBMI', () => {
    test('应该正确计算标准BMI', () => {
      // 体重70kg, 身高175cm
      const bmi = util.calculateBMI(70, 175);
      expect(bmi).toBeCloseTo(22.86, 1);
    });

    test('应该正确计算偏瘦BMI', () => {
      // 体重50kg, 身高175cm
      const bmi = util.calculateBMI(50, 175);
      expect(bmi).toBeCloseTo(16.33, 1);
    });

    test('应该正确计算超重BMI', () => {
      // 体重80kg, 身高175cm
      const bmi = util.calculateBMI(80, 175);
      expect(bmi).toBeCloseTo(26.12, 1);
    });

    test('应该正确计算肥胖BMI', () => {
      // 体重95kg, 身高175cm
      const bmi = util.calculateBMI(95, 175);
      expect(bmi).toBeCloseTo(31.02, 1);
    });

    test('无效身高应该返回0', () => {
      expect(util.calculateBMI(70, 0)).toBe(0);
      expect(util.calculateBMI(70, -10)).toBe(0);
    });

    test('无效体重应该返回0', () => {
      expect(util.calculateBMI(0, 175)).toBe(0);
      expect(util.calculateBMI(-5, 175)).toBe(0);
    });

    test('边界值测试', () => {
      // 极小值
      expect(util.calculateBMI(0.1, 1)).toBeGreaterThan(0);
      // 极大值
      expect(util.calculateBMI(500, 250)).toBeLessThan(1000);
    });
  });

  // ==================== BMI 分类测试 ====================
  describe('getBMICategory', () => {
    test('BMI <= 0 应该返回"暂无数据"', () => {
      const result = util.getBMICategory(0);
      expect(result.label).toBe('暂无数据');
      expect(result.color).toBe('#94a3b8');
    });

    test('BMI < 18.5 应该返回"偏瘦"', () => {
      const result = util.getBMICategory(17.5);
      expect(result.label).toBe('偏瘦');
      expect(result.color).toBe('#f97316');
    });

    test('BMI = 18.5 应该返回"正常"', () => {
      const result = util.getBMICategory(18.5);
      expect(result.label).toBe('正常');
    });

    test('18.5 <= BMI < 24 应该返回"正常"', () => {
      const result = util.getBMICategory(22);
      expect(result.label).toBe('正常');
      expect(result.color).toBe('#22c55e');
    });

    test('BMI = 24 应该返回"超重"', () => {
      const result = util.getBMICategory(24);
      expect(result.label).toBe('超重');
    });

    test('24 <= BMI < 28 应该返回"超重"', () => {
      const result = util.getBMICategory(26);
      expect(result.label).toBe('超重');
      expect(result.color).toBe('#f97316');
    });

    test('BMI = 28 应该返回"肥胖"', () => {
      const result = util.getBMICategory(28);
      expect(result.label).toBe('肥胖');
    });

    test('BMI >= 28 应该返回"肥胖"', () => {
      const result = util.getBMICategory(32);
      expect(result.label).toBe('肥胖');
      expect(result.color).toBe('#ef4444');
    });

    test('边界值测试', () => {
      expect(util.getBMICategory(18.49).label).toBe('偏瘦');
      expect(util.getBMICategory(18.5).label).toBe('正常');
      expect(util.getBMICategory(23.99).label).toBe('正常');
      expect(util.getBMICategory(24).label).toBe('超重');
      expect(util.getBMICategory(27.99).label).toBe('超重');
      expect(util.getBMICategory(28).label).toBe('肥胖');
    });
  });

  // ==================== BMI 样式测试 ====================
  describe('getBMIStyles', () => {
    test('BMI <= 0 应该返回灰色样式', () => {
      const styles = util.getBMIStyles(0);
      expect(styles.bg).toBe('bg-gray-light');
      expect(styles.color).toBe('#94a3b8');
    });

    test('偏瘦应该返回橙色样式', () => {
      const styles = util.getBMIStyles(17);
      expect(styles.bg).toBe('bg-orange-light');
      expect(styles.color).toBe('#f97316');
    });

    test('正常应该返回绿色样式', () => {
      const styles = util.getBMIStyles(22);
      expect(styles.bg).toBe('bg-green-light');
      expect(styles.color).toBe('#22c55e');
    });

    test('超重应该返回黄色样式', () => {
      const styles = util.getBMIStyles(26);
      expect(styles.bg).toBe('bg-yellow-light');
      expect(styles.color).toBe('#f59e0b');
    });

    test('肥胖应该返回红色样式', () => {
      const styles = util.getBMIStyles(30);
      expect(styles.bg).toBe('bg-red-light');
      expect(styles.color).toBe('#ef4444');
    });
  });

  // ==================== 日期格式化测试 ====================
  describe('formatDate', () => {
    test('应该正确格式化日期', () => {
      const result = util.formatDate('2024-03-15');
      expect(result).toBe('2024年3月15日');
    });

    test('应该处理跨年日期', () => {
      const result = util.formatDate('2023-12-31');
      expect(result).toBe('2023年12月31日');
    });

    test('应该处理1月日期', () => {
      const result = util.formatDate('2024-01-01');
      expect(result).toBe('2024年1月1日');
    });
  });

  describe('formatShortDate', () => {
    test('应该正确格式化短日期', () => {
      const result = util.formatShortDate('2024-03-15');
      expect(result).toBe('3/15');
    });

    test('应该处理跨年短日期', () => {
      const result = util.formatShortDate('2023-12-31');
      expect(result).toBe('12/31');
    });
  });

  describe('getTodayString', () => {
    test('应该返回正确的日期格式', () => {
      const result = util.getTodayString();
      // 验证格式 YYYY-MM-DD
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('应该返回今天的日期', () => {
      const result = util.getTodayString();
      const today = new Date().toISOString().split('T')[0];
      expect(result).toBe(today);
    });
  });

  // ==================== ID 生成测试 ====================
  describe('generateId', () => {
    test('应该生成非空字符串', () => {
      const id = util.generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    test('每次生成的ID应该不同', () => {
      const id1 = util.generateId();
      const id2 = util.generateId();
      expect(id1).not.toBe(id2);
    });

    test('生成的ID应该包含时间戳信息', () => {
      const id = util.generateId();
      // 验证是36进制的时间戳+随机数格式
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  // ==================== 集成测试 ====================
  describe('工具函数集成', () => {
    test('完整的体重记录流程', () => {
      // 模拟一次体重记录
      const weight = 72.5;
      const height = 178;
      const date = util.getTodayString();
      const id = util.generateId();

      // 计算BMI
      const bmi = util.calculateBMI(weight, height);
      expect(bmi).toBeGreaterThan(0);

      // 获取BMI分类
      const category = util.getBMICategory(bmi);
      expect(category).toHaveProperty('label');
      expect(category).toHaveProperty('color');

      // 获取BMI样式
      const styles = util.getBMIStyles(bmi);
      expect(styles).toHaveProperty('bg');
      expect(styles).toHaveProperty('color');

      // 格式化日期
      const formattedDate = util.formatDate(date);
      expect(formattedDate).toContain('年');
      expect(formattedDate).toContain('月');
      expect(formattedDate).toContain('日');
    });

    test('体重变化趋势分析', () => {
      // 模拟一周的体重数据
      const weeklyData = [
        { date: '2024-03-01', weight: 71.0 },
        { date: '2024-03-02', weight: 70.8 },
        { date: '2024-03-03', weight: 70.5 },
        { date: '2024-03-04', weight: 70.3 },
        { date: '2024-03-05', weight: 70.0 },
        { date: '2024-03-06', weight: 69.8 },
        { date: '2024-03-07', weight: 69.5 }
      ];

      // 计算体重变化
      const startWeight = weeklyData[0].weight;
      const endWeight = weeklyData[weeklyData.length - 1].weight;
      const weightChange = endWeight - startWeight;

      expect(weightChange).toBeLessThan(0); // 体重下降
      expect(Math.abs(weightChange)).toBeCloseTo(1.5, 1);

      // 验证日期格式化
      weeklyData.forEach(entry => {
        const shortDate = util.formatShortDate(entry.date);
        expect(shortDate).toMatch(/^\d{1,2}\/\d{1,2}$/);
      });
    });
  });
});

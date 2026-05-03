/**
 * 积分服务模块
 * 处理积分获取、查询、规则管理等
 */

import { adapter } from './db-adapter';

// 积分类型
export enum PointType {
  LOGIN = 'login',
  CHECKIN_FITNESS = 'checkin_fitness',
  CHECKIN_READING = 'checkin_reading',
  CONTINUOUS_3 = 'continuous_3',
  CONTINUOUS_7 = 'continuous_7',
  CONTINUOUS_30 = 'continuous_30',
  ADMIN_ADJUST = 'admin_adjust'
}

// 打卡类型
export enum CheckInType {
  FITNESS = 'fitness',
  READING = 'reading'
}

// 积分规则接口
export interface PointRule {
  type: PointType;
  name: string;
  points: number;
  dailyLimit?: number;
  description: string;
}

// 积分记录接口
export interface PointsLog {
  id?: string;
  userId: string | number;
  type: PointType;
  points: number;
  description: string;
  relatedId?: string; // 关联的打卡ID等
  createdAt: Date;
}

// 连续打卡接口
export interface UserStreak {
  id?: string;
  userId: string | number;
  type: CheckInType;
  currentStreak: number;
  maxStreak: number;
  lastCheckIn: Date;
  totalCheckIns: number;
}

// 用户积分统计
export interface UserPointsSummary {
  totalPoints: number;
  todayPoints: number;
  weekPoints: number;
  monthPoints: number;
  currentStreak: {
    fitness: number;
    reading: number;
  };
}

class PointsService {
  private readonly COLLECTIONS = {
    POINTS_LOGS: 'points_logs',
    USER_STREAKS: 'user_streaks',
    POINT_RULES: 'point_rules'
  };

  /**
   * 获取积分规则
   */
  async getPointRules(): Promise<PointRule[]> {
    const db = (adapter as any).db;
    const { data } = await db.collection(this.COLLECTIONS.POINT_RULES).get();
    return data.map((d: any) => ({
      type: d.type,
      name: d.name,
      points: d.points,
      dailyLimit: d.dailyLimit,
      description: d.description
    }));
  }

  /**
   * 获取用户当前积分
   */
  async getUserPoints(userId: string | number): Promise<number> {
    const db = (adapter as any).db;
    const { data } = await db.collection(this.COLLECTIONS.POINTS_LOGS)
      .where({ userId })
      .get();
    
    return data.reduce((sum: number, log: any) => sum + (log.points || 0), 0);
  }

  /**
   * 获取用户积分统计
   */
  async getUserPointsSummary(userId: string | number): Promise<UserPointsSummary> {
    const db = (adapter as any).db;
    const now = new Date();
    
    // 今日开始时间
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // 本周开始时间
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    // 本月开始时间
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: logs } = await db.collection(this.COLLECTIONS.POINTS_LOGS)
      .where({ userId })
      .get();

    // 计算各时间段积分
    let totalPoints = 0;
    let todayPoints = 0;
    let weekPoints = 0;
    let monthPoints = 0;

    logs.forEach((log: any) => {
      const points = log.points || 0;
      const createdAt = new Date(log.createdAt);
      
      totalPoints += points;
      
      if (createdAt >= todayStart) {
        todayPoints += points;
      }
      if (createdAt >= weekStart) {
        weekPoints += points;
      }
      if (createdAt >= monthStart) {
        monthPoints += points;
      }
    });

    // 获取连续打卡
    const { data: streaks } = await db.collection(this.COLLECTIONS.USER_STREAKS)
      .where({ userId })
      .get();

    const streakMap: Record<string, number> = {};
    streaks.forEach((s: any) => {
      streakMap[s.type] = s.currentStreak || 0;
    });

    return {
      totalPoints,
      todayPoints,
      weekPoints,
      monthPoints,
      currentStreak: {
        fitness: streakMap[CheckInType.FITNESS] || 0,
        reading: streakMap[CheckInType.READING] || 0
      }
    };
  }

  /**
   * 获取用户积分记录
   */
  async getUserPointsLogs(
    userId: string | number,
    options: { page?: number; limit?: number; type?: PointType } = {}
  ): Promise<{ logs: PointsLog[]; total: number }> {
    const db = (adapter as any).db;
    const { page = 1, limit = 20, type } = options;
    const skip = (page - 1) * limit;

    let query = db.collection(this.COLLECTIONS.POINTS_LOGS).where({ userId });
    
    if (type) {
      query = query.where({ type });
    }

    const { data, total } = await query
      .orderBy('createdAt', 'desc')
      .skip(skip)
      .limit(limit)
      .get();

    return {
      logs: data.map((d: any) => ({
        id: d._id,
        userId: d.userId,
        type: d.type,
        points: d.points,
        description: d.description,
        relatedId: d.relatedId,
        createdAt: new Date(d.createdAt)
      })),
      total
    };
  }

  /**
   * 增加积分
   */
  async addPoints(
    userId: string | number,
    type: PointType,
    points: number,
    description: string,
    relatedId?: string
  ): Promise<PointsLog> {
    const db = (adapter as any).db;
    
    const log = {
      userId,
      type,
      points,
      description,
      relatedId,
      createdAt: new Date()
    };

    const { id } = await db.collection(this.COLLECTIONS.POINTS_LOGS).add(log);
    
    return { ...log, id };
  }

  /**
   * 检查今日是否已获取某类型积分
   */
  async hasEarnedPointsToday(
    userId: string | number,
    type: PointType
  ): Promise<boolean> {
    const db = (adapter as any).db;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await db.collection(this.COLLECTIONS.POINTS_LOGS)
      .where({
        userId,
        type,
        createdAt: db.command.gte(today)
      })
      .limit(1)
      .get();

    return data.length > 0;
  }

  /**
   * 处理每日登录积分
   */
  async handleLoginPoints(userId: string | number): Promise<PointsLog | null> {
    // 检查今日是否已登录
    const hasEarned = await this.hasEarnedPointsToday(userId, PointType.LOGIN);
    if (hasEarned) {
      return null;
    }

    const rules = await this.getPointRules();
    const rule = rules.find(r => r.type === PointType.LOGIN);
    
    if (!rule) {
      return null;
    }

    return this.addPoints(
      userId,
      PointType.LOGIN,
      rule.points,
      rule.description
    );
  }

  /**
   * 处理打卡积分（含连续打卡奖励）
   */
  async handleCheckInPoints(
    userId: string | number,
    checkInType: CheckInType,
    checkInId: string
  ): Promise<PointsLog[]> {
    const logs: PointsLog[] = [];
    const db = (adapter as any).db;
    
    // 1. 基础打卡积分
    const pointType = checkInType === CheckInType.FITNESS 
      ? PointType.CHECKIN_FITNESS 
      : PointType.CHECKIN_READING;
    
    const hasEarned = await this.hasEarnedPointsToday(userId, pointType);
    
    if (!hasEarned) {
      const rules = await this.getPointRules();
      const rule = rules.find(r => r.type === pointType);
      
      if (rule) {
        const log = await this.addPoints(
          userId,
          pointType,
          rule.points,
          rule.description,
          checkInId
        );
        logs.push(log);
      }
    }

    // 2. 更新连续打卡并计算奖励
    const streakLogs = await this.updateStreakAndReward(userId, checkInType);
    logs.push(...streakLogs);

    return logs;
  }

  /**
   * 更新连续打卡并发放奖励
   */
  private async updateStreakAndReward(
    userId: string | number,
    checkInType: CheckInType
  ): Promise<PointsLog[]> {
    const db = (adapter as any).db;
    const logs: PointsLog[] = [];
    const now = new Date();
    
    // 获取或创建连续打卡记录
    let { data: streaks } = await db.collection(this.COLLECTIONS.USER_STREAKS)
      .where({ userId, type: checkInType })
      .get();
    
    let streak: any = streaks[0];
    
    if (!streak) {
      // 创建新的连续打卡记录
      const { id } = await db.collection(this.COLLECTIONS.USER_STREAKS).add({
        userId,
        type: checkInType,
        currentStreak: 1,
        maxStreak: 1,
        lastCheckIn: now,
        totalCheckIns: 1
      });
      streak = { _id: id, currentStreak: 1 };
    } else {
      // 检查是否连续
      const lastCheckIn = new Date(streak.lastCheckIn);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      
      const lastCheckInDate = new Date(lastCheckIn);
      lastCheckInDate.setHours(0, 0, 0, 0);
      
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      let newStreak = streak.currentStreak;
      
      if (lastCheckInDate.getTime() === yesterday.getTime()) {
        // 昨天打卡了，连续+1
        newStreak += 1;
      } else if (lastCheckInDate.getTime() === today.getTime()) {
        // 今天已经打卡过了，不重复计算
        return logs;
      } else {
        // 断签了，重新计算
        newStreak = 1;
      }
      
      // 更新记录
      const maxStreak = Math.max(newStreak, streak.maxStreak || 0);
      await db.collection(this.COLLECTIONS.USER_STREAKS).doc(streak._id).update({
        currentStreak: newStreak,
        maxStreak,
        lastCheckIn: now,
        totalCheckIns: (streak.totalCheckIns || 0) + 1
      });
      
      streak.currentStreak = newStreak;
    }

    // 3. 检查连续打卡奖励
    const rules = await this.getPointRules();
    const currentStreak = streak.currentStreak;
    
    // 连续3天奖励
    if (currentStreak === 3) {
      const rule = rules.find(r => r.type === PointType.CONTINUOUS_3);
      if (rule) {
        const log = await this.addPoints(
          userId,
          PointType.CONTINUOUS_3,
          rule.points,
          `${rule.description} (${checkInType === CheckInType.FITNESS ? '健身' : '读书'})`
        );
        logs.push(log);
      }
    }
    
    // 连续7天奖励
    if (currentStreak === 7) {
      const rule = rules.find(r => r.type === PointType.CONTINUOUS_7);
      if (rule) {
        const log = await this.addPoints(
          userId,
          PointType.CONTINUOUS_7,
          rule.points,
          `${rule.description} (${checkInType === CheckInType.FITNESS ? '健身' : '读书'})`
        );
        logs.push(log);
      }
    }
    
    // 连续30天奖励
    if (currentStreak === 30) {
      const rule = rules.find(r => r.type === PointType.CONTINUOUS_30);
      if (rule) {
        const log = await this.addPoints(
          userId,
          PointType.CONTINUOUS_30,
          rule.points,
          `${rule.description} (${checkInType === CheckInType.FITNESS ? '健身' : '读书'})`
        );
        logs.push(log);
      }
    }

    return logs;
  }

  /**
   * Admin: 调整用户积分
   */
  async adjustUserPoints(
    userId: string | number,
    points: number,
    reason: string,
    adminId: string | number
  ): Promise<PointsLog> {
    return this.addPoints(
      userId,
      PointType.ADMIN_ADJUST,
      points,
      `管理员调整: ${reason}`,
      String(adminId)
    );
  }

  /**
   * 获取积分排行榜
   */
  async getPointsRanking(limit: number = 10): Promise<Array<{ userId: string; username: string; totalPoints: number; streakDays: number }>> {
    const db = (adapter as any).db;
    
    // 获取所有积分记录，按用户分组
    const { data: allLogs } = await db.collection(this.COLLECTIONS.POINTS_LOGS).get();
    
    // 按用户汇总积分
    const userPoints: Record<string, { totalPoints: number; username: string }> = {};
    
    allLogs.forEach((log: any) => {
      const uid = String(log.userId);
      if (!userPoints[uid]) {
        userPoints[uid] = { totalPoints: 0, username: log.username || uid };
      }
      userPoints[uid].totalPoints += (log.points || 0);
    });
    
    // 获取用户 streak 信息
    const { data: allStreaks } = await db.collection(this.COLLECTIONS.USER_STREAKS).get();
    const userStreaks: Record<string, number> = {};
    allStreaks.forEach((s: any) => {
      const uid = String(s.userId);
      userStreaks[uid] = Math.max(userStreaks[uid] || 0, s.currentStreak || 0);
    });
    
    // 排序并返回前 N 名
    const ranking = Object.entries(userPoints)
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        totalPoints: data.totalPoints,
        streakDays: userStreaks[userId] || 0
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
    
    return ranking;
  }

  /**
   * 获取连续打卡信息
   */
  async getUserStreak(
    userId: string | number,
    type: CheckInType
  ): Promise<UserStreak | null> {
    const db = (adapter as any).db;
    
    const { data } = await db.collection(this.COLLECTIONS.USER_STREAKS)
      .where({ userId, type })
      .get();
    
    if (data.length === 0) {
      return null;
    }

    const streak = data[0];
    return {
      id: streak._id,
      userId: streak.userId,
      type: streak.type,
      currentStreak: streak.currentStreak,
      maxStreak: streak.maxStreak,
      lastCheckIn: new Date(streak.lastCheckIn),
      totalCheckIns: streak.totalCheckIns
    };
  }
}

// 导出单例
export const pointsService = new PointsService();

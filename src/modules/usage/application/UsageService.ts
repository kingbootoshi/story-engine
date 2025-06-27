import { injectable } from 'tsyringe';
import { supabase } from '../../../core/infra/supabase';
import { createLogger } from '../../../core/infra/logger';
import type { UserAIUsage, UsageSummary } from '../domain/schema';

const logger = createLogger('usage.service');

@injectable()
export class UsageService {
  /**
   * Get usage records for a user within a date range
   */
  async getUsageRecords(
    userId: string, 
    startDate?: Date, 
    endDate?: Date,
    limit: number = 100
  ): Promise<UserAIUsage[]> {
    logger.info('Fetching usage records', { 
      userId, 
      startDate, 
      endDate, 
      limit 
    });

    let query = supabase
      .from('user_ai_usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch usage records', error, { userId });
      throw error;
    }

    return data || [];
  }

  /**
   * Get usage summary for a user
   */
  async getUsageSummary(
    userId: string,
    period: 'day' | 'week' | 'month' | 'all' = 'month'
  ): Promise<UsageSummary> {
    logger.info('Generating usage summary', { userId, period });

    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'all':
        startDate = new Date('2000-01-01'); // Effectively all time
        break;
    }

    const records = await this.getUsageRecords(userId, startDate, endDate, 1000);

    // Aggregate data
    let totalTokens = 0;
    let totalCost = 0;
    const usageByModel: Record<string, { tokens: number; cost: number }> = {};
    const usageByModule: Record<string, { tokens: number; cost: number }> = {};

    for (const record of records) {
      totalTokens += record.total_tokens;
      totalCost += record.total_cost;

      // Aggregate by model
      if (!usageByModel[record.model]) {
        usageByModel[record.model] = { tokens: 0, cost: 0 };
      }
      usageByModel[record.model].tokens += record.total_tokens;
      usageByModel[record.model].cost += record.total_cost;

      // Aggregate by module
      if (!usageByModule[record.module]) {
        usageByModule[record.module] = { tokens: 0, cost: 0 };
      }
      usageByModule[record.module].tokens += record.total_tokens;
      usageByModule[record.module].cost += record.total_cost;
    }

    return {
      user_id: userId,
      period,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      total_tokens: totalTokens,
      total_cost: totalCost,
      usage_by_model: usageByModel,
      usage_by_module: usageByModule
    };
  }

  /**
   * Get current month's usage for billing
   */
  async getCurrentMonthUsage(userId: string): Promise<{
    tokens: number;
    cost: number;
    daily_average: number;
  }> {
    logger.info('Fetching current month usage', { userId });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const records = await this.getUsageRecords(userId, startOfMonth, now, 1000);

    const totalTokens = records.reduce((sum, r) => sum + r.total_tokens, 0);
    const totalCost = records.reduce((sum, r) => sum + r.total_cost, 0);
    
    const daysInMonth = now.getDate();
    const dailyAverage = totalCost / daysInMonth;

    return {
      tokens: totalTokens,
      cost: totalCost,
      daily_average: dailyAverage
    };
  }
}
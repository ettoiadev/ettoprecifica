import { supabase } from '../../lib/supabase/client';
import { PricingConfig } from '../../types/pricing';

export const configService = {
  async getPricingConfig(userId: string): Promise<PricingConfig | null> {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('config_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data.config_data as PricingConfig;
  },

  async savePricingConfig(userId: string, config: PricingConfig): Promise<void> {
    const { data: existing } = await supabase
      .from('pricing_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('pricing_configs')
        .update({
          config_data: config,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('pricing_configs').insert({
        user_id: userId,
        config_data: config,
        is_default: true,
      });

      if (error) throw error;
    }
  },

  async getBudgetSettings(userId: string) {
    const { data, error } = await supabase
      .from('budget_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      paymentMethod: data.payment_method || '',
      deliveryTime: data.delivery_time || '',
      warranty: data.warranty || '',
    };
  },

  async saveBudgetSettings(userId: string, settings: any): Promise<void> {
    const { data: existing } = await supabase
      .from('budget_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('budget_settings')
        .update({
          payment_method: settings.paymentMethod,
          delivery_time: settings.deliveryTime,
          warranty: settings.warranty,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('budget_settings').insert({
        user_id: userId,
        payment_method: settings.paymentMethod,
        delivery_time: settings.deliveryTime,
        warranty: settings.warranty,
      });

      if (error) throw error;
    }
  },
};

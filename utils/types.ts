export interface IDbCategory {
  category: {
    id: number;
    name: string;
    slug: string;
    level: number;
  };
}

export interface IDbPreference {
  id: number;
  created_at: string;
  name: string;
  country: string;
  min_score: number;
  delay: number;
  price_error: boolean;
  cadence: string;
  incremental: boolean;
  whatsapp_notification_report: boolean;
  whatsapp_notification_single_deals: boolean;
}

export interface IDbMerchant {
  merchant: {
    id: number;
    name: string;
    url: string;
  };
}

export interface IDbBrand {
  brand: {
    id: number;
    name: string;
    slug: string;
  };
}

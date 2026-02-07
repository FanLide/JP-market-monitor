export interface Item {
  id: string;
  title: string;
  price: number;
  url: string;
  imageUrl: string;
  platform: 'PayPay' | 'Mercari' | 'Yahoo' | 'Rakuma';
  timestamp: Date;
}

export interface ScraperConfig {
  keyword: string;
  priceThreshold: number;
}

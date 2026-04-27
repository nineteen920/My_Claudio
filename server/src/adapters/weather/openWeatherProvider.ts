import { createMockWeatherProvider } from './mockWeatherProvider';
import type { WeatherProvider } from './types';

export function createOpenWeatherProvider(config: { apiKey?: string; city: string }): WeatherProvider {
  const fallback = createMockWeatherProvider();

  if (!config.apiKey) {
    return fallback;
  }

  const apiKey = config.apiKey;

  return {
    async getWeather() {
      try {
        const url = new URL('https://api.openweathermap.org/data/2.5/weather');
        url.searchParams.set('q', config.city);
        url.searchParams.set('appid', apiKey);
        url.searchParams.set('units', 'metric');
        url.searchParams.set('lang', 'zh_cn');
        const response = await fetch(url);
        if (!response.ok) throw new Error(`OpenWeather 请求失败：${response.status}`);
        const payload = (await response.json()) as {
          weather?: Array<{ main?: string; description?: string }>;
          main?: { temp?: number };
        };
        const weather = payload.weather?.[0];
        return {
          condition: weather?.main ?? 'unknown',
          temperatureC: Math.round(payload.main?.temp ?? 0),
          summary: `${weather?.description ?? '天气未知'}，${Math.round(payload.main?.temp ?? 0)}°C`
        };
      } catch {
        return fallback.getWeather();
      }
    }
  };
}

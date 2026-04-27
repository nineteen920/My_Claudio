import type { WeatherSummary } from '../../../../shared/types';

export interface WeatherProvider {
  getWeather(now?: Date): Promise<WeatherSummary>;
}

import type { WeatherProvider } from './types';

export function createMockWeatherProvider(): WeatherProvider {
  return {
    async getWeather() {
      return {
        condition: 'rain',
        temperatureC: 18,
        summary: '小雨，空气潮湿'
      };
    }
  };
}

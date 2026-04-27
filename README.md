# Claudio AI 电台

Claudio 是一个本地优先的个人 AI 电台 MVP：把长期积累的私人歌单变成可播放的 PWA，并结合口味资料、天气、日程、播放历史和反馈，生成推荐理由与电台串场。

第一版只做个人本地电台，不包含账号、公开分享、UPnP、DLNA 或家庭音箱播放。

## 快速启动

```bash
npm install
npm run dev
```

启动后打开：

- 播放器：`http://127.0.0.1:5173`
- API 健康检查：`http://127.0.0.1:8787/api/health`

如果本机 `npm` 命令异常，可以分别启动前后端：

```bash
.\node_modules\.bin\tsx.cmd server/src/index.ts
.\node_modules\.bin\vite.cmd --host 127.0.0.1
```

## 填写 API

把 `.env.example` 复制成 `.env`，然后在 `.env` 里填写密钥和服务地址。

```bash
copy .env.example .env
```

默认所有供应商都是 `mock`，不填任何密钥也能跑通完整流程。

### 大模型

默认：

```env
LLM_PROVIDER=mock
LLM_MODEL=mock-radio-dj
```

使用 OpenAI 兼容接口：

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://api.openai.com/v1
LLM_API_KEY=你的大模型密钥
LLM_MODEL=gpt-4o-mini
```

也可以把 `LLM_BASE_URL` 换成其他兼容 `/chat/completions` 的服务地址，例如本地模型、通义、智谱或其他中转服务。

### 音乐

默认：

```env
MUSIC_PROVIDER=mock
```

这会读取 `data/profile/playlists.json` 里的本地歌单。稳定使用建议先走这个方式。

实验性网易云搜索适配器：

```env
MUSIC_PROVIDER=netease
NETEASE_API_BASE_URL=http://127.0.0.1:3000
```

这里的 `NETEASE_API_BASE_URL` 指向你自己启动的 NetEaseCloudMusicApi 服务。第一版仍建议把真正要播放的歌曲导入到 `playlists.json`，这样最稳定。

### 语音合成

默认：

```env
TTS_PROVIDER=mock
```

使用 Fish Audio：

```env
TTS_PROVIDER=fish
FISH_AUDIO_API_KEY=你的 Fish Audio 密钥
FISH_AUDIO_VOICE_ID=你的声音 ID
```

TTS 失败时，播放器仍会显示文字串场，音乐流程不会中断。

### 天气

默认：

```env
WEATHER_PROVIDER=mock
WEATHER_CITY=Shanghai
```

使用 OpenWeather：

```env
WEATHER_PROVIDER=openweather
OPENWEATHER_API_KEY=你的 OpenWeather 密钥
WEATHER_CITY=Shanghai
```

天气只是推荐上下文，不会阻塞播放。

## 导入歌曲

歌曲列表在：

```text
data/profile/playlists.json
```

每首歌的格式如下：

```json
{
  "id": "song-rain",
  "title": "雨中循环",
  "artist": "Claudio 档案",
  "album": "十四年歌单",
  "audioUrl": "/audio/rain-loop.mp3",
  "durationSeconds": 188,
  "source": "local",
  "tags": ["rain", "focus", "warm"]
}
```

字段说明：

- `id`：唯一 ID，不要重复。
- `title`：歌曲名。
- `artist`：歌手名。
- `album`：专辑名，可选但建议填写。
- `audioUrl`：浏览器可以播放的音频地址。
- `durationSeconds`：歌曲时长，单位秒。
- `source`：来源标记，例如 `local`、`netease`、`mock`。
- `tags`：给推荐用的标签，例如 `rain`、`focus`、`night`、`warm`。

### 使用本地音频

把音频文件放到：

```text
public/audio/
```

例如：

```text
public/audio/rain-loop.mp3
```

然后在 `playlists.json` 里写：

```json
"audioUrl": "/audio/rain-loop.mp3"
```

支持浏览器可播放的常见格式，例如 `.mp3`、`.wav`、`.ogg`、`.m4a`。如果使用远程直链，也可以把 `audioUrl` 写成 `https://...`。

## 调整个人口味

这些文件会进入推荐上下文：

- `data/profile/taste.md`：你的音乐审美、偏好、雷区。
- `data/profile/routines.md`：一天里的时间段和使用场景。
- `data/profile/mood-rules.md`：天气、心情、场景到音乐策略的规则。
- `data/profile/playlists.json`：可选歌曲池。

改完这些文件后，刷新播放器或点击“下一首”即可看到效果。

## 常用接口

- `GET /api/now`：读取当前播放状态。
- `GET /api/next`：生成下一首。
- `POST /api/chat`：用自然语言点歌。
- `POST /api/feedback`：记录喜欢、跳过、不喜欢、收藏等反馈。
- `GET /api/taste`：读取当前口味摘要。
- `GET /api/calendar/today`：读取今天的模拟日程。
- `WS /stream`：推送播放状态和系统事件。

示例：

```bash
curl http://127.0.0.1:8787/api/next
```

```bash
curl -X POST http://127.0.0.1:8787/api/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\":\"来点雨天适合写代码的歌\"}"
```

## 重置电台记忆

运行过程中会自动生成：

```text
data/state/radio-state.json
```

它保存当前歌曲、播放历史和反馈。想清空记忆时，停止服务后删除这个文件即可；下次启动会自动重建。

## 验证

```bash
.\node_modules\.bin\tsc.cmd --noEmit
.\node_modules\.bin\vitest.cmd run
.\node_modules\.bin\vite.cmd build
```

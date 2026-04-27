import {
  Bookmark,
  CalendarDays,
  CloudRain,
  Gauge,
  Heart,
  MessageSquare,
  Pause,
  Play,
  Radio,
  Settings,
  SkipForward,
  Sparkles,
  ThumbsDown,
  Volume2
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import type { FeedbackType, RadioState } from '../../shared/types';
import { getNext, getNow, sendChat, sendFeedback, setPlaybackStatus } from './api';

const emptyState: RadioState = {
  status: 'idle',
  environment: {
    scene: '待机',
    weather: {
      condition: 'unknown',
      temperatureC: 0,
      summary: '等待天气上下文'
    },
    calendar: {
      date: new Date().toISOString().slice(0, 10),
      events: []
    }
  },
  history: [],
  feedback: [],
  updatedAt: new Date(0).toISOString()
};

function formatDuration(seconds?: number) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

function wsUrl() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/stream`;
}

function providerLabel(provider?: string) {
  if (provider === 'mock') return '模拟模型';
  if (provider === 'openai-compatible') return 'OpenAI 兼容模型';
  return '模拟模型待命';
}

export default function App() {
  const [state, setState] = useState<RadioState>(emptyState);
  const [chatText, setChatText] = useState('按现在的天气来一首');
  const [notice, setNotice] = useState('本地电台待机中');
  const [busy, setBusy] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastFeedback, setLastFeedback] = useState<string>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRef = useRef<HTMLAudioElement | null>(null);

  const current = state.current;
  const isPlaying = state.status === 'playing';

  const recentHistory = useMemo(() => state.history.slice(-5).reverse(), [state.history]);

  useEffect(() => {
    getNow()
      .then(setState)
      .catch((error) => setNotice(`连接本地服务失败：${error.message}`));
  }, []);

  useEffect(() => {
    let socket: WebSocket | undefined;
    try {
      socket = new WebSocket(wsUrl());
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data) as { type: string; state?: RadioState; message?: string };
        if (payload.type === 'state' && payload.state) {
          setState(payload.state);
        }
        if (payload.type === 'event' && payload.message) {
          setNotice(payload.message);
        }
      };
    } catch {
      setNotice('WebSocket 未连接，仍可使用轮询式操作');
    }

    return () => socket?.close();
  }, []);

  useEffect(() => {
    if (current?.song.audioUrl && audioRef.current) {
      audioRef.current.load();
    }
  }, [current?.song.audioUrl]);

  async function loadNext(prompt?: string) {
    setBusy(true);
    setNotice('Claudio 正在翻你的歌单');
    try {
      const nextState = prompt ? await sendChat(prompt) : await getNext();
      setState(nextState);
      setNotice('下一首已准备好');
      if (nextState.current?.ttsAudioUrl && ttsRef.current) {
        ttsRef.current.src = nextState.current.ttsAudioUrl;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      setNotice(`生成失败：${message}`);
      setState((value) => ({ ...value, status: 'error', error: message }));
    } finally {
      setBusy(false);
    }
  }

  async function togglePlayback() {
    if (!current || !audioRef.current) {
      await loadNext();
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setState(await setPlaybackStatus('paused'));
        setNotice('已暂停');
      } else {
        if (current.ttsAudioUrl && ttsRef.current) {
          ttsRef.current.src = current.ttsAudioUrl;
          await ttsRef.current.play().catch(() => undefined);
        }
        await audioRef.current.play();
        setState(await setPlaybackStatus('playing'));
        setNotice('正在播放');
      }
    } catch {
      setNotice('浏览器阻止了自动播放，请再点一次播放');
    }
  }

  async function submitChat(event: FormEvent) {
    event.preventDefault();
    const prompt = chatText.trim();
    if (!prompt) return;
    await loadNext(prompt);
  }

  async function recordFeedback(type: FeedbackType, label: string) {
    if (!current) {
      setNotice('先让 Claudio 选一首歌');
      return;
    }

    setLastFeedback(label);
    const nextState = await sendFeedback({ type, note: label });
    setState(nextState);
    setNotice(`已记录：${label}`);
  }

  return (
    <main className="app-shell">
      <audio
        ref={audioRef}
        src={current?.song.audioUrl}
        onEnded={() => loadNext('接着刚才的情绪继续')}
        onPause={() => setState((value) => ({ ...value, status: value.status === 'playing' ? 'paused' : value.status }))}
      />
      <audio ref={ttsRef} />

      <section className="radio-console" aria-label="Claudio AI 电台">
        <header className="topbar">
          <div className="brand-lockup">
            <span className="brand-mark" aria-hidden="true">
              <Radio size={24} />
            </span>
            <div>
              <p className="eyebrow">个人 AI 电台</p>
              <h1>Claudio</h1>
            </div>
          </div>

          <div className="status-strip" aria-live="polite">
            <span className={`pulse ${state.status}`} />
            <span>{notice}</span>
          </div>

          <button
            className="icon-button"
            type="button"
            aria-label="设置"
            title="设置"
            onClick={() => setSettingsOpen((value) => !value)}
          >
            <Settings size={20} />
          </button>
        </header>

        <div className="content-grid">
          <section className="player-panel" aria-label="播放器">
            <div className="cover-plate">
              <div className="record">
                <span className={isPlaying ? 'record-groove spinning' : 'record-groove'} />
                <Sparkles className="record-spark" size={34} />
              </div>
            </div>

            <div className="track-copy">
              <p className="panel-label">当前播放</p>
              <h2>{current?.song.title ?? '等待第一首歌'}</h2>
              <p className="artist-line">{current ? `${current.song.artist} · ${current.song.album ?? '未知专辑'}` : '让十四年的歌单先呼吸一下'}</p>
              <p className="duration-line">{formatDuration(current?.song.durationSeconds)}</p>
            </div>

            <div className="transport">
              <button className="transport-button primary" type="button" aria-label={isPlaying ? '暂停' : '播放'} onClick={togglePlayback}>
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
              <button className="transport-button" type="button" aria-label="下一首" onClick={() => loadNext()} disabled={busy}>
                <SkipForward size={22} />
                <span>下一首</span>
              </button>
            </div>
          </section>

          <section className="ai-panel" aria-label="AI 串场">
            <p className="panel-label">串场</p>
            <blockquote>{current?.segueText ?? 'Claudio 会在这里说出为什么是这一首。'}</blockquote>
            <div className="reason-box">
              <Gauge size={18} />
              <p>{current?.reason ?? '推荐理由会结合口味、天气、时间和最近反馈。'}</p>
            </div>
          </section>

          <section className="context-panel" aria-label="上下文">
            <div className="context-item">
              <CloudRain size={19} />
              <div>
                <span>天气</span>
                <strong>{state.environment.weather.summary}</strong>
              </div>
            </div>
            <div className="context-item">
              <CalendarDays size={19} />
              <div>
                <span>场景</span>
                <strong>{state.environment.scene}</strong>
              </div>
            </div>
            <div className="context-item">
              <Volume2 size={19} />
              <div>
                <span>模型</span>
                <strong>{providerLabel(current?.provider)}</strong>
              </div>
            </div>
          </section>

          <section className="command-panel" aria-label="自然语言指令">
            <form onSubmit={submitChat}>
              <label htmlFor="chat-input">想听什么</label>
              <div className="chat-row">
                <input
                  id="chat-input"
                  value={chatText}
                  onChange={(event) => setChatText(event.target.value)}
                  placeholder="来点雨天适合写代码的歌"
                />
                <button type="submit" aria-label="发送指令" disabled={busy}>
                  <MessageSquare size={19} />
                </button>
              </div>
            </form>
          </section>

          <section className="feedback-panel" aria-label="偏好反馈">
            <p className="panel-label">偏好反馈</p>
            <div className="feedback-grid">
              <button type="button" aria-label="喜欢" onClick={() => recordFeedback('like', '喜欢')}>
                <Heart size={18} />
                <span>喜欢</span>
              </button>
              <button type="button" aria-label="跳过" onClick={() => recordFeedback('skip', '跳过')}>
                <SkipForward size={18} />
                <span>跳过</span>
              </button>
              <button type="button" aria-label="不喜欢" onClick={() => recordFeedback('dislike', '不喜欢')}>
                <ThumbsDown size={18} />
                <span>不喜欢</span>
              </button>
              <button type="button" aria-label="收藏" onClick={() => recordFeedback('save', '收藏')}>
                <Bookmark size={18} />
                <span>收藏</span>
              </button>
            </div>
            <p className="feedback-note">{lastFeedback ? `刚刚记录：${lastFeedback}` : '反馈会进入下一次推荐上下文。'}</p>
          </section>

          <section className="history-panel" aria-label="最近播放">
            <p className="panel-label">播放记忆</p>
            <ol>
              {recentHistory.length === 0 ? (
                <li className="empty-history">还没有播放记忆</li>
              ) : (
                recentHistory.map((item) => (
                  <li key={`${item.songId}-${item.playedAt}`}>
                    <span>{item.title}</span>
                    <small>{item.reason}</small>
                  </li>
                ))
              )}
            </ol>
          </section>
        </div>

        {settingsOpen ? (
          <aside className="settings-panel" aria-label="设置面板">
            <h3>本地第一版设置</h3>
            <p>大模型、音乐、语音合成、天气都走可替换适配器。没有 API 密钥时自动使用模拟供应商，不影响主流程。</p>
            <dl>
              <div>
                <dt>大模型</dt>
                <dd>OpenAI 兼容 / 模拟</dd>
              </div>
              <div>
                <dt>音乐</dt>
                <dd>网易云适配器 / 模拟歌单</dd>
              </div>
              <div>
                <dt>语音合成</dt>
                <dd>Fish Audio 适配器 / 文字降级</dd>
              </div>
            </dl>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

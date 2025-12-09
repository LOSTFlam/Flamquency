# Flamquency — расширение до продвинутой DAW

Цель: сочетать существующий веб-UI (React/Vite) с нативным аудиодвижком на C++/JUCE, поддержкой плагинов (VST3/AU/CLAP), улучшенной маршрутизацией, офлайн/онлайн рендером, расширенным аранжером и генеративным блоком (Gemini) для музыки/микса.

## Фазы
1) Базовый нативный аудиодвижок (C++/JUCE)
   - CoreAudio/ASIO/WASAPI, выбор устройства, низкая задержка.
   - AudioProcessorGraph как ядро маршрутизации.
   - Транспорт (play/stop/loop), метроном, клок/таймкод.
2) Плагин-хостинг
   - VST3/AU (CLAP — по возможности) через JUCE AudioPluginFormatManager.
   - Изоляция/санкбоксинг (позже: отдельный процесс).
   - Кэш/сканер плагинов, пресеты.
3) Треки, микшер, маршрутизация
   - Трековые процессоры как узлы графа, сабгруппы, посылы/возвраты, мастер.
   - Автоматизация параметров (envelopes/lanes).
   - Offline bounce/stems.
4) Связка с веб-UI
   - IPC/WebSocket API между фронтом и нативным движком.
   - Реалтайм обновления метра/времени, уровней, состояний плагинов.
   - Передача WAV/AIFF/FLAC буферов и MIDI эвентов.
5) Аранжер/редакторы в вебе
   - Улучшенный таймлайн, клипы (MIDI/Audio), групповая редакция.
   - Zoom/scroll, снап, многодорожечный выбор, drag/drop, trim, fade кривые.
6) Генеративный блок (Gemini)
   - Генерация идей (мелодии/грувы/лиды/тексты), ассистент по миксу.
   - Контекст: текущий BPM/тональность/жанр + предпросмотр треков.
7) Продакшн-хардненинг
   - Профилирование (Tracy), санитайзеры, автотесты (Catch2/GoogleTest), интеграционные регрессы.

## Рекомендуемый стек
- Натив: C++20/23, JUCE 7+, CMake. Форматы: VST3/AU (macOS), VST3 (Windows), CLAP (опционально).
- Драйверы: CoreAudio (macOS), ASIO (Windows, Steinberg SDK), WASAPI fallback.
- DSP: JUCE DSP, при росте — Eigen/Faust для матриц/конволюций.
- IPC: WebSocket/JSON-RPC или gRPC-web через прокси (envoy/bridge).
- Web UI: существующий React/Vite, Zustand/Context (уже есть), расширение состояний треков/клипов/плагинов.
- Storage: IndexedDB для сэмплов в браузере, на стороне нативки — диск + кэш пресетов/сканов плагинов.

## Архитектура (укрупненно)
- Native Engine (C++/JUCE):
  - DeviceManager + AudioProcessorGraph (узлы: трековые процессоры, посылы, мастер).
  - PluginHost: загрузка/скан, управление параметрами, пресеты.
  - Transport: tempo, time sig, позиция, loop, метроном.
  - Render: онлайн (реалтайм), офлайн bounce/stems.
  - IPC Server: принимает команды от веб-UI (create track, load sample, add plugin, set param, play/stop, seek).
- Web App (TS/React):
  - Модели: Project/Tracks/Clips/Plugins/Automation.
  - Editors: Arranger, PianoRoll, Drum Sequencer, Mixer view.
  - Gemini Assist: идеи, цепочки, лиры, рекомендации по миксу.
  - Sync: подписка на состояния от нативки (playhead, meters, peak/RMS, latency info).

## Минимальный POC нативного движка (каркас)
- Создать отдельный репо/папку `native/` с JUCE CMake:
  - Core: AudioEngine (DeviceManager, Graph, Transport).
  - TrackProcessor: стрип (gain/pan), посылы.
  - FilePlayerProcessor: воспроизведение WAV/AIFF с фейдами.
  - IPC: простой WebSocket JSON-RPC (asio/boost/beast или libwebsockets) — команды start/stop/loadFile/setParam.
- Веб: добавить сервис-слой `services/nativeBridge.ts`:
  - WebSocket клиент, методы: `connect()`, `play()`, `stop()`, `seek()`, `loadSample(trackId, file) => отправка blob/base64`, `addPlugin(trackId, pluginId)`, `setParam(nodeId, paramId, value)`.
  - Хранить latency/device info в контексте, отображать метры/клок.

## Приоритетные улучшения в текущем веб-UI
- Arranger:
  - Zoom (wheel+ctrl), snap/grid (1/4..1/32, триоли), многократный выбор.
  - Перетаскивание клипов между треками, дублирование, группировка.
  - Fade кривые (не только линейные).
  - Автоматизация (позже): линии параметров (volume/pan/send).
- Mixer stub:
  - Таблица треков с фейдерами/пэнами, слотами плагинов (пока mock на веб-стороне), посылами.
- Storage:
  - Уже есть IndexedDB для аудио. Добавить манифест проекта (tracks/clips/plugins) — сохранять/грузить снапшоты; сериализация automation позже.

## Gemini интеграция (web)
- Сервис для генерации идей: жанр/BPM/тональность → MIDI-паттерны/тексты/цепочки плагинов (JSON).
- Подсказки по миксу: входные метаданные (жанр, тип трека) → цепочка EQ/Comp/Sat/FX, значения параметров (будут маппиться на реальные плагины в нативке).
- UI: панель ассистента в аранжере/микшере, кнопки “Apply to Track” → отправка на нативку через IPC (`setParam`/`insertPlugin`).

## Дорожная карта задач (конкретнее)
### Sprint 1 — Native ядро (минимум)
- [ ] Создать `native/` JUCE CMake проект.
- [ ] Реализовать AudioEngine с AudioProcessorGraph, DeviceManager init, транспорт.
- [ ] Узел FilePlayerProcessor: прием пути/буфера, фейд in/out, gain/pan.
- [ ] IPC WebSocket JSON-RPC: команды play/stop/seek/loadFile/setGain/setPan.
- [ ] CLI smoke: открыть устройство, загрузить WAV, воспроизвести, loop.

### Sprint 2 — Связка с вебом
- [ ] Веб-клиент `services/nativeBridge.ts`: подключение, команды, статусы.
- [ ] UI: добавить панель подключения (host/port), индикация состояния, play/stop/seek с нативного транспорта.
- [ ] Отправка клипов: загрузка файла → пересылка в нативку (chunk/base64) → ответ с `bufferId`.
- [ ] Отображение meters/позиции (стрим из нативки).

### Sprint 3 — Плагины и микшер
- [ ] Сканер/кэш плагинов (VST3/AU), KnownPluginList.
- [ ] Узлы: TrackStrip (gain/pan), PluginNode, Send/Return, MasterLimiter.
- [ ] API: addPlugin(trackId, formatId, pluginId), setParam, bypass, save/load preset blob.
- [ ] Веб UI: слоты плагинов, параметры (auto-mapped), посылы.

### Sprint 4 — Arranger улучшения
- [ ] Zoom/snap, множественный выбор, drag to move/duplicate.
- [ ] Trim с кривыми fade, отрисовка клипов с волной (буфер предварительно генерится в нативке и кешируется в IndexedDB).
- [ ] Automation lanes (volume/pan/send), точечные узлы, линейные/кривые сегменты.

### Sprint 5 — Генеративный ассистент
- [ ] Prompt templates для Gemini (мелодия, грув, микс-советы).
- [ ] Применение: конвертация ответа в MIDI/параметры плагинов/цепочки.
- [ ] Контекст: BPM/key/genre + краткий микс-снимок (RMS/peak/crest от нативки).

## Минимальный каркас native API (JSON-RPC пример)
- `connect` (web→native): open socket.
- `loadFile { trackId, clipId, name, bytesBase64 }` → `{ bufferId, durationSec }`
- `play`, `stop`, `seek { positionSec }`, `setLoop { startSec, endSec }`
- `setTrackGain { trackId, gain }`, `setTrackPan { trackId, pan }`
- `addPlugin { trackId, format, pluginId }`
- `setParam { nodeId, paramId, value }`
- `renderOffline { path, stem: bool }`
- Events (native→web): `transport { position, playing }`, `meters { trackId, peak, rms }`, `device { samplerate, blocksize, latencyMs }`, `pluginParam { nodeId, paramId, value }`

## Что дальше
- Создать `native/` с JUCE и описанным каркасом.
- Добавить веб-сервис `nativeBridge.ts` и панель подключения в UI.
- Расширить Arranger (zoom/snap/multi-select), Mixer (слоты плагинов, посылы), и Gemni панели (идеи/микс советы) — по мере готовности IPC.



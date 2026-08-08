import { createLocaleController } from './i18n.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const swapPair = (state) => ({ ...state, a: state.b, b: state.a });

export const selectPair = (state, side, requestedId) => {
  const other = side === 'a' ? 'b' : 'a';
  if (state[other] === requestedId) return swapPair(state);
  return { ...state, [side]: requestedId };
};

export const syncRunStrip = (pair, runIds) => runIds.map((id) => ({
  id,
  a: pair.a === id,
  b: pair.b === id,
}));

export const seekByMasterProgress = (videos, mode, progress) => {
  const ratio = clamp(progress, 0, 1);
  if (mode === 'progress') {
    videos.forEach((video) => {
      if (Number.isFinite(video.duration)) video.currentTime = video.duration * ratio;
    });
    return;
  }
  const maximum = Math.max(0, ...videos.map((video) => (
    Number.isFinite(video.duration) ? video.duration : 0
  )));
  const target = maximum * ratio;
  videos.forEach((video) => {
    if (Number.isFinite(video.duration)) video.currentTime = Math.min(target, video.duration);
  });
};

export const syncRelativeProgress = (leader, follower) => {
  if (!Number.isFinite(leader.duration) || !Number.isFinite(follower.duration)) return;
  const leaderRatio = leader.currentTime / leader.duration;
  const followerRatio = follower.currentTime / follower.duration;
  if (Math.abs(leaderRatio - followerRatio) > 0.02) {
    follower.currentTime = follower.duration * leaderRatio;
  }
};

export const syncAbsoluteTime = (leader, follower) => {
  if (!Number.isFinite(follower.duration)) return;
  const target = Math.min(leader.currentTime, follower.duration);
  if (Math.abs(follower.currentTime - target) > 0.20) follower.currentTime = target;
};

export const setAudioSource = (videos, source) => {
  videos.forEach((video, index) => {
    video.muted = source !== (index === 0 ? 'a' : 'b');
  });
};

export const buildVideoCatalog = (triggers) => triggers
  .filter((trigger) => trigger.dataset.mediaType === 'video')
  .map((trigger) => ({
    id: trigger.dataset.mediaId,
    titleKey: trigger.dataset.mediaTitleKey,
    descriptionKey: trigger.dataset.mediaDescriptionKey,
    src: trigger.dataset.mediaSrc,
    poster: trigger.dataset.mediaPoster || '',
    width: Number(trigger.dataset.mediaWidth),
    height: Number(trigger.dataset.mediaHeight),
    frames: Number(trigger.dataset.mediaFrames),
    duration: Number(trigger.dataset.mediaDuration),
    steps: Number(trigger.dataset.mediaSteps),
    elapsed: trigger.dataset.mediaElapsed === '' ? null : Number(trigger.dataset.mediaElapsed),
    statusKey: trigger.dataset.mediaStatusKey,
    tier: trigger.dataset.mediaTier,
    recommendationKey: trigger.dataset.mediaRecommendationKey || '',
  }));

export const localizeCatalogItem = (item, translate) => ({
  title: item.titleKey ? translate(item.titleKey) : '',
  description: item.descriptionKey ? translate(item.descriptionKey) : '',
  status: item.statusKey ? translate(item.statusKey) : '',
  recommendation: item.recommendationKey ? translate(item.recommendationKey) : '',
});

export const refreshLocalizedState = (state) => ({ ...state });

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds)) return '00:00';
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
};

const comparisonText = (aValue, bValue, aText, bText, equalText) => {
  if (aValue === bValue) return equalText;
  return aValue > bValue ? aText : bText;
};

export const buildComparisonMetrics = (a, b, translate) => {
  const aPixels = a.width * a.height;
  const bPixels = b.width * b.height;
  return [
    {
      label: translate('telemetry.resolution'),
      aValue: `${a.width}×${a.height}`,
      bValue: `${b.width}×${b.height}`,
      note: comparisonText(
        aPixels, bPixels,
        translate('telemetry.aHigherResolution'),
        translate('telemetry.bHigherResolution'),
        translate('telemetry.equalPixels'),
      ),
    },
    {
      label: translate('telemetry.frames'),
      aValue: translate('unit.frames', { value: a.frames }),
      bValue: translate('unit.frames', { value: b.frames }),
      note: comparisonText(
        a.frames, b.frames,
        translate('telemetry.aMoreFrames'),
        translate('telemetry.bMoreFrames'),
        translate('telemetry.equalFrames'),
      ),
    },
    {
      label: translate('telemetry.duration'),
      aValue: translate('unit.seconds', { value: a.duration.toFixed(3) }),
      bValue: translate('unit.seconds', { value: b.duration.toFixed(3) }),
      note: comparisonText(
        a.duration, b.duration,
        translate('telemetry.aLonger'),
        translate('telemetry.bLonger'),
        translate('telemetry.equalDuration'),
      ),
    },
    {
      label: translate('telemetry.sampling'),
      aValue: `${a.steps} steps`,
      bValue: `${b.steps} steps`,
      note: comparisonText(
        a.steps, b.steps,
        translate('telemetry.aMoreSteps'),
        translate('telemetry.bMoreSteps'),
        translate('telemetry.equalSteps'),
      ),
    },
    {
      label: translate('telemetry.elapsed'),
      aValue: a.elapsed == null
        ? translate('status.notRecorded')
        : translate('unit.seconds', { value: a.elapsed.toFixed(2) }),
      bValue: b.elapsed == null
        ? translate('status.notRecorded')
        : translate('unit.seconds', { value: b.elapsed.toFixed(2) }),
      note: a.elapsed == null || b.elapsed == null
        ? translate('telemetry.missingElapsed')
        : comparisonText(
          a.elapsed, b.elapsed,
          translate('telemetry.bFaster'),
          translate('telemetry.aFaster'),
          translate('telemetry.equalElapsed'),
        ),
    },
    {
      label: translate('telemetry.result'),
      aValue: translate(a.statusKey),
      bValue: translate(b.statusKey),
      note: translate('telemetry.verifiedResults'),
    },
  ];
};

export const renderComparisonDiff = (container, a, b, translate) => {
  if (!container || !a || !b || typeof document === 'undefined') return;
  const metrics = buildComparisonMetrics(a, b, translate);
  const items = metrics.map(({ label, aValue, bValue, note }) => {
    const item = document.createElement('article');
    item.className = 'compare-diff-item';
    const heading = document.createElement('h3');
    const aOutput = document.createElement('span');
    const noteOutput = document.createElement('strong');
    const bOutput = document.createElement('span');
    heading.textContent = label;
    aOutput.textContent = `A ${aValue}`;
    noteOutput.textContent = note;
    bOutput.textContent = `B ${bValue}`;
    item.append(heading, aOutput, noteOutput, bOutput);
    return item;
  });
  container.replaceChildren(...items);
};

export const createCompareController = ({ catalog, railElements, controls, translate }) => {
  if (catalog.length < 2 || !railElements.a || !railElements.b) return null;
  const catalogById = new Map(catalog.map((item) => [item.id, item]));
  const rails = Object.fromEntries(Object.entries(railElements).map(([side, element]) => [side, {
    element,
    select: element.querySelector('select'),
    title: element.querySelector('[data-compare-title]'),
    spec: element.querySelector('[data-compare-spec]'),
    video: element.querySelector('[data-compare-video]'),
    source: element.querySelector('[data-compare-source]'),
    fallback: element.querySelector('[data-compare-fallback]'),
    error: element.querySelector('.media-error'),
  }]));
  const videos = [rails.a.video, rails.b.video];
  let state = {
    a: rails.a.select.dataset.default || catalog[0].id,
    b: rails.b.select.dataset.default || catalog[1].id,
    mode: 'progress',
    audio: 'muted',
    playing: false,
  };
  let currentStatus = { key: 'compare.loading', params: {}, tone: 'ready' };
  let animationFrame = 0;

  const itemFor = (side) => catalogById.get(state[side]);
  const copyFor = (side) => ({ ...itemFor(side), ...localizeCatalogItem(itemFor(side), translate) });
  const renderStatus = () => {
    controls.status.textContent = translate(currentStatus.key, currentStatus.params);
    controls.status.dataset.state = currentStatus.tone;
  };
  const setStatus = (key, params = {}, tone = 'ready') => {
    currentStatus = { key, params, tone };
    renderStatus();
  };

  const currentProgress = () => {
    if (state.mode === 'progress') {
      const ratios = videos.map((video) => (
        Number.isFinite(video.duration) && video.duration > 0 ? video.currentTime / video.duration : 0
      ));
      return clamp((ratios[0] + ratios[1]) / 2, 0, 1);
    }
    const maximum = Math.max(...videos.map((video) => Number.isFinite(video.duration) ? video.duration : 0), 0);
    const current = Math.max(...videos.map((video) => video.currentTime || 0), 0);
    return maximum > 0 ? clamp(current / maximum, 0, 1) : 0;
  };

  const updateClock = () => {
    const progress = currentProgress();
    controls.progress.value = String(Math.round(progress * 1000));
    controls.clock.textContent = `${Math.round(progress * 100)}% / A ${formatTime(videos[0].currentTime)} / B ${formatTime(videos[1].currentTime)}`;
  };

  const applyPlaybackRates = () => {
    if (state.mode === 'time') {
      videos.forEach((video) => { video.playbackRate = 1; });
      return;
    }
    const durations = [itemFor('a').duration, itemFor('b').duration];
    const maximum = Math.max(...durations);
    videos.forEach((video, index) => { video.playbackRate = durations[index] / maximum; });
  };

  const pauseBoth = (statusKey = 'compare.paused', params = {}) => {
    videos.forEach((video) => video.pause());
    cancelAnimationFrame(animationFrame);
    state = { ...state, playing: false };
    controls.play.textContent = translate('compare.play');
    if (statusKey) setStatus(statusKey, params);
    updateClock();
  };

  const reset = (announce = true) => {
    pauseBoth('');
    videos.forEach((video) => { video.currentTime = 0; });
    controls.progress.value = '0';
    updateClock();
    if (announce) setStatus('compare.resetDone');
  };

  const renderFrame = () => {
    if (!state.playing) return;
    if (state.mode === 'progress') {
      syncRelativeProgress(videos[0], videos[1]);
    } else {
      const leaderIndex = videos[1].currentTime > videos[0].currentTime ? 1 : 0;
      syncAbsoluteTime(videos[leaderIndex], videos[leaderIndex === 0 ? 1 : 0]);
    }
    updateClock();
    animationFrame = requestAnimationFrame(renderFrame);
  };

  const playBoth = async () => {
    const atEnd = videos.every((video) => (
      Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.05
    ));
    if (atEnd) reset(false);
    applyPlaybackRates();
    setAudioSource(videos, state.audio);
    const results = await Promise.allSettled(videos.map((video) => video.play()));
    if (results.some((result) => result.status === 'rejected')) {
      pauseBoth('');
      setStatus('compare.autoplayBlocked', {}, 'error');
      return;
    }
    state = { ...state, playing: true };
    controls.play.textContent = translate('compare.pause');
    setStatus(state.mode === 'progress' ? 'compare.playingProgress' : 'compare.playingTime');
    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(renderFrame);
  };

  const togglePlayback = () => state.playing ? pauseBoth() : playBoth();

  const renderRailCopy = (side) => {
    const rail = rails[side];
    const item = copyFor(side);
    rail.select.value = item.id;
    rail.title.textContent = item.title;
    rail.spec.textContent = `${item.width}×${item.height} / ${translate('unit.frames', { value: item.frames })} / ${translate('unit.seconds', { value: item.duration.toFixed(3) })} / ${item.steps} steps`;
    rail.video.setAttribute('aria-label', translate('compare.trackVideo', { side: side.toUpperCase(), title: item.title }));
  };

  const renderRailMedia = (side) => {
    const rail = rails[side];
    const item = itemFor(side);
    rail.video.pause();
    rail.video.querySelectorAll('source').forEach((source) => source.remove());
    rail.video.src = item.src;
    rail.video.poster = item.poster;
    rail.source.href = item.src;
    rail.source.dataset.mediaId = item.id;
    rail.fallback.href = item.src;
    rail.error.hidden = true;
    rail.video.load();
  };

  const renderPair = () => {
    renderRailMedia('a');
    renderRailMedia('b');
    renderRailCopy('a');
    renderRailCopy('b');
    renderComparisonDiff(controls.diff, itemFor('a'), itemFor('b'), translate);
    applyPlaybackRates();
  };

  const applySelection = (side, requestedId) => {
    if (!catalogById.has(requestedId)) return;
    pauseBoth('');
    state = selectPair(state, side, requestedId);
    renderPair();
    reset(false);
    setStatus('compare.selectionUpdated');
  };

  const populateSelect = (select, selectedId) => {
    const options = catalog.map((item) => {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = localizeCatalogItem(item, translate).title;
      option.selected = item.id === selectedId;
      return option;
    });
    select.replaceChildren(...options);
  };

  const refreshLocale = () => {
    state = refreshLocalizedState(state);
    populateSelect(rails.a.select, state.a);
    populateSelect(rails.b.select, state.b);
    renderRailCopy('a');
    renderRailCopy('b');
    renderComparisonDiff(controls.diff, itemFor('a'), itemFor('b'), translate);
    controls.play.textContent = translate(state.playing ? 'compare.pause' : 'compare.play');
    renderStatus();
  };

  rails.a.select.addEventListener('change', () => applySelection('a', rails.a.select.value));
  rails.b.select.addEventListener('change', () => applySelection('b', rails.b.select.value));
  controls.play.addEventListener('click', togglePlayback);
  controls.reset.addEventListener('click', () => reset());
  controls.progress.addEventListener('input', () => {
    const requestedProgress = Number(controls.progress.value) / 1000;
    pauseBoth('');
    seekByMasterProgress(videos, state.mode, requestedProgress);
    updateClock();
    setStatus('compare.seekUpdated');
  });

  controls.sync.forEach((input) => input.addEventListener('change', () => {
    if (!input.checked) return;
    const progress = currentProgress();
    pauseBoth('');
    state = { ...state, mode: input.value };
    applyPlaybackRates();
    seekByMasterProgress(videos, state.mode, progress);
    updateClock();
    setStatus(state.mode === 'progress' ? 'compare.modeProgress' : 'compare.modeTime');
  }));

  controls.audio.forEach((input) => input.addEventListener('change', () => {
    if (!input.checked) return;
    state = { ...state, audio: input.value };
    setAudioSource(videos, state.audio);
    setStatus(
      state.audio === 'muted' ? 'compare.bothMuted' : 'compare.singleAudio',
      state.audio === 'muted' ? {} : { side: state.audio.toUpperCase() },
    );
  }));

  videos.forEach((video, index) => {
    video.addEventListener('loadedmetadata', () => {
      controls.progress.disabled = !videos.every((candidate) => candidate.readyState >= 1);
      if (!controls.progress.disabled) setStatus('compare.ready');
      updateClock();
    });
    video.addEventListener('timeupdate', updateClock);
    video.addEventListener('ended', () => {
      if (!state.playing) return;
      if (state.mode === 'progress' || videos.every((candidate) => candidate.ended)) {
        pauseBoth('compare.finished');
      } else {
        setStatus('compare.trackEnded', { side: index === 0 ? 'A' : 'B' });
      }
    });
    video.addEventListener('error', () => {
      pauseBoth('');
      rails[index === 0 ? 'a' : 'b'].error.hidden = false;
      setStatus('compare.loadFailed', { side: index === 0 ? 'A' : 'B' }, 'error');
    });
  });

  populateSelect(rails.a.select, state.a);
  populateSelect(rails.b.select, state.b);
  renderPair();
  reset(false);
  setAudioSource(videos, 'muted');
  setStatus('compare.loading');
  return {
    applySelection, playBoth, pauseBoth, reset, seekByMasterProgress,
    setAudioSource, refreshLocale, getState: () => ({ ...state }),
  };
};

const initSite = () => {
  let storage;
  try { storage = window.localStorage; } catch { storage = undefined; }
  const locale = createLocaleController({ document, storage });
  const translate = (key, params) => locale.t(key, params);
  const canonicalTriggers = [...document.querySelectorAll('[data-media-catalog]')];
  const mediaItems = canonicalTriggers.map((trigger) => ({
    id: trigger.dataset.mediaId,
    type: trigger.dataset.mediaType,
    src: trigger.dataset.mediaSrc,
    poster: trigger.dataset.mediaPoster || '',
    titleKey: trigger.dataset.mediaTitleKey,
    descriptionKey: trigger.dataset.mediaDescriptionKey,
    statusKey: trigger.dataset.mediaStatusKey,
    recommendationKey: trigger.dataset.mediaRecommendationKey,
    width: Number(trigger.dataset.mediaWidth),
    height: Number(trigger.dataset.mediaHeight),
  }));
  const videoCatalog = buildVideoCatalog(canonicalTriggers);
  const railElements = {
    a: document.querySelector('[data-compare-side="a"]'),
    b: document.querySelector('[data-compare-side="b"]'),
  };
  const controller = createCompareController({
    catalog: videoCatalog,
    railElements,
    translate,
    controls: {
      play: document.querySelector('#compare-play-toggle'),
      reset: document.querySelector('#compare-reset'),
      progress: document.querySelector('#compare-progress'),
      clock: document.querySelector('#compare-clock'),
      status: document.querySelector('#compare-status'),
      diff: document.querySelector('#compare-diff-grid'),
      sync: [...document.querySelectorAll('input[name="compare-sync"]')],
      audio: [...document.querySelectorAll('input[name="compare-audio"]')],
    },
  });

  const runStrip = document.querySelector('.run-strip');
  const runItems = [...document.querySelectorAll('.run-item[data-run-id]')];
  const runCatalog = new Map(videoCatalog.map((item) => [item.id, item]));
  const renderRunStrip = () => {
    const pair = {
      a: railElements.a?.querySelector('select')?.value,
      b: railElements.b?.querySelector('select')?.value,
    };
    syncRunStrip(pair, runItems.map((item) => item.dataset.runId)).forEach((assignment, index) => {
      const item = runItems[index];
      const run = runCatalog.get(assignment.id);
      const runName = translate(`run.${assignment.id}`);
      item.classList.toggle('is-a', assignment.a);
      item.classList.toggle('is-b', assignment.b);
      item.querySelector('[data-run-title]').textContent = runName;
      item.querySelector('[data-run-spec]').textContent = `${run.width}×${run.height} · ${translate('unit.frames', { value: run.frames })}`;
      item.querySelector('[data-run-status]').textContent = run.elapsed == null
        ? translate('run.successUntimed')
        : translate('run.successTimed', { elapsed: run.elapsed.toFixed(2) });
      item.querySelectorAll('[data-run-assign]').forEach((button) => {
        button.setAttribute('aria-pressed', String(assignment[button.dataset.runAssign]));
        button.setAttribute('aria-label', translate('run.assign', {
          run: runName,
          side: button.dataset.runAssign.toUpperCase(),
        }));
      });
    });
  };

  runStrip?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-run-assign][data-run-id]');
    if (!button || !controller) return;
    controller.applySelection(button.dataset.runAssign, button.dataset.runId);
    renderRunStrip();
  });
  railElements.a?.querySelector('select')?.addEventListener('change', renderRunStrip);
  railElements.b?.querySelector('select')?.addEventListener('change', renderRunStrip);
  renderRunStrip();

  const mediaLightbox = document.querySelector('#media-lightbox');
  const mediaStage = document.querySelector('#media-stage');
  const lightboxVideo = document.querySelector('#lightbox-video');
  const lightboxImage = document.querySelector('#lightbox-image');
  const mediaTitle = document.querySelector('#media-title');
  const mediaKind = document.querySelector('#media-kind');
  const mediaCounter = document.querySelector('#media-counter');
  const mediaDescription = document.querySelector('#media-description');
  const mediaDimensions = document.querySelector('#media-dimensions');
  const mediaError = document.querySelector('#media-lightbox-error');
  const mediaSourceLink = document.querySelector('#media-open-source');
  const mediaPrevious = document.querySelector('#media-previous');
  const mediaNext = document.querySelector('#media-next');
  const mediaNative = document.querySelector('#media-native');
  const mediaFit = document.querySelector('#media-fit');
  const mediaClose = document.querySelector('#media-close');
  let activeMediaIndex = 0;
  let activeMediaMode = 'fit';
  let lastMediaTrigger = null;

  const activeMediaItem = () => mediaItems[activeMediaIndex];
  const activeMediaCopy = () => ({
    ...activeMediaItem(),
    ...localizeCatalogItem(activeMediaItem(), translate),
  });
  const setNativeDimensions = (element, width, height) => {
    element.style.setProperty('--media-native-width', `${width}px`);
    element.style.setProperty('--media-native-height', `${height}px`);
    mediaDimensions.textContent = translate('unit.originalPixels', { width, height });
  };
  const setMediaMode = (mode) => {
    activeMediaMode = mode === 'native' ? 'native' : 'fit';
    mediaStage.dataset.mediaMode = activeMediaMode;
    mediaFit.setAttribute('aria-pressed', String(activeMediaMode === 'fit'));
    mediaNative.setAttribute('aria-pressed', String(activeMediaMode === 'native'));
    if (activeMediaMode === 'fit') mediaStage.scrollTo({ top: 0, left: 0 });
  };
  const clearLightboxMedia = () => {
    lightboxVideo.pause();
    lightboxVideo.removeAttribute('src');
    lightboxVideo.removeAttribute('poster');
    lightboxVideo.load();
    lightboxVideo.hidden = true;
    lightboxImage.removeAttribute('src');
    lightboxImage.hidden = true;
  };
  const showLightboxError = () => {
    const filename = activeMediaItem()?.src.split('/').pop() || translate('dialog.mediaFile');
    mediaError.hidden = false;
    mediaError.textContent = translate('dialog.loadFailed', { filename });
  };
  const renderMedia = () => {
    const item = activeMediaCopy();
    if (!item) return;
    clearLightboxMedia();
    mediaError.hidden = true;
    mediaError.textContent = '';
    mediaTitle.textContent = item.title;
    mediaKind.textContent = item.type === 'video' ? 'VIDEO' : 'IMAGE';
    mediaCounter.textContent = `${activeMediaIndex + 1} / ${mediaItems.length}`;
    mediaDescription.textContent = item.description;
    mediaDimensions.textContent = translate('unit.originalPixels', { width: item.width, height: item.height });
    mediaSourceLink.href = item.src;
    if (item.type === 'video') {
      lightboxVideo.hidden = false;
      lightboxVideo.poster = item.poster;
      lightboxVideo.src = item.src;
      lightboxVideo.setAttribute('aria-label', item.title);
      setNativeDimensions(lightboxVideo, item.width, item.height);
      lightboxVideo.load();
    } else {
      lightboxImage.hidden = false;
      lightboxImage.alt = item.title;
      setNativeDimensions(lightboxImage, item.width, item.height);
      lightboxImage.src = item.src;
    }
    setMediaMode(activeMediaMode);
  };
  const refreshMediaCopy = () => {
    if (!mediaLightbox?.open) return;
    const item = activeMediaCopy();
    mediaTitle.textContent = item.title;
    mediaDescription.textContent = item.description;
    mediaDimensions.textContent = translate('unit.originalPixels', { width: item.width, height: item.height });
    lightboxVideo.setAttribute('aria-label', item.title);
    lightboxImage.alt = item.title;
    if (!mediaError.hidden) showLightboxError();
  };
  const openMedia = (index, trigger) => {
    if (!mediaLightbox || typeof mediaLightbox.showModal !== 'function') return;
    activeMediaIndex = index;
    activeMediaMode = 'fit';
    lastMediaTrigger = trigger;
    document.querySelectorAll('video').forEach((video) => video.pause());
    controller?.pauseBoth('');
    renderMedia();
    if (!mediaLightbox.open) mediaLightbox.showModal();
    document.documentElement.classList.add('media-open');
    mediaClose.focus();
  };
  const closeMedia = () => {
    clearLightboxMedia();
    setMediaMode('fit');
    if (mediaLightbox.open) mediaLightbox.close();
    document.documentElement.classList.remove('media-open');
    const trigger = lastMediaTrigger;
    lastMediaTrigger = null;
    requestAnimationFrame(() => trigger?.focus());
  };
  const stepMedia = (delta) => {
    activeMediaIndex = (activeMediaIndex + delta + mediaItems.length) % mediaItems.length;
    renderMedia();
  };

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest?.('[data-media-trigger]');
    if (!trigger || !mediaLightbox || typeof mediaLightbox.showModal !== 'function') return;
    const index = mediaItems.findIndex((item) => item.id === trigger.dataset.mediaId);
    if (index < 0) return;
    event.preventDefault();
    openMedia(index, trigger);
  });
  mediaPrevious?.addEventListener('click', () => stepMedia(-1));
  mediaNext?.addEventListener('click', () => stepMedia(1));
  mediaFit?.addEventListener('click', () => setMediaMode('fit'));
  mediaNative?.addEventListener('click', () => setMediaMode('native'));
  mediaClose?.addEventListener('click', closeMedia);
  mediaLightbox?.addEventListener('cancel', (event) => { event.preventDefault(); closeMedia(); });
  mediaLightbox?.addEventListener('click', (event) => { if (event.target === mediaLightbox) closeMedia(); });
  document.addEventListener('keydown', (event) => {
    if (!mediaLightbox?.open) return;
    if (event.key === 'Escape') { event.preventDefault(); closeMedia(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); stepMedia(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); stepMedia(1); }
    if (event.key === ' ' && !event.target.closest?.('button, a, input, textarea, select, video') && !lightboxVideo.hidden) {
      event.preventDefault();
      if (lightboxVideo.paused) lightboxVideo.play().catch(showLightboxError);
      else lightboxVideo.pause();
    }
  });
  lightboxImage?.addEventListener('load', () => {
    const item = activeMediaItem();
    setNativeDimensions(lightboxImage, lightboxImage.naturalWidth || item.width, lightboxImage.naturalHeight || item.height);
  });
  lightboxVideo?.addEventListener('loadedmetadata', () => {
    const item = activeMediaItem();
    setNativeDimensions(lightboxVideo, lightboxVideo.videoWidth || item.width, lightboxVideo.videoHeight || item.height);
  });
  lightboxImage?.addEventListener('error', showLightboxError);
  lightboxVideo?.addEventListener('error', showLightboxError);

  const localeStatus = document.querySelector('#locale-status');
  locale.subscribe(() => {
    controller?.refreshLocale();
    renderRunStrip();
    refreshMediaCopy();
    if (localeStatus) localeStatus.textContent = translate('language.changed');
  });
  document.querySelectorAll('[data-locale]').forEach((button) => {
    button.addEventListener('click', () => locale.setLocale(button.dataset.locale));
  });

  document.querySelectorAll('video:not([data-compare-video])').forEach((video) => {
    video.addEventListener('error', () => {
      const errorMessage = video.closest('.video-shell')?.querySelector('.media-error');
      if (errorMessage) errorMessage.hidden = false;
    });
  });

  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const experimentRows = [...document.querySelectorAll('[data-result]')];
  filterButtons.forEach((button) => button.addEventListener('click', () => {
    const requested = button.dataset.filter;
    filterButtons.forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    experimentRows.forEach((row) => { row.hidden = requested !== 'all' && row.dataset.result !== requested; });
  }));

  document.querySelectorAll('[data-copy-target]').forEach((button) => button.addEventListener('click', async () => {
    const target = document.querySelector(`#${button.dataset.copyTarget}`);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      button.textContent = translate('clipboard.copied');
    } catch {
      button.textContent = translate('clipboard.manual');
    }
    window.setTimeout(() => { button.textContent = translate('clipboard.copyHash'); }, 1800);
  }));

  const readingProgressBar = document.querySelector('#reading-progress-bar');
  readingProgressBar?.setAttribute('data-css-driven', 'true');

  const navigationLinks = [...document.querySelectorAll('.site-nav a[href^="#"]')];
  if ('IntersectionObserver' in window && navigationLinks.length) {
    const navigationSections = navigationLinks
      .map((link) => ({ link, section: document.querySelector(link.getAttribute('href')) }))
      .filter(({ section }) => section);
    const navigationObserver = new IntersectionObserver((entries) => {
      const activeEntry = entries.find((entry) => entry.isIntersecting);
      if (!activeEntry) return;
      navigationSections.forEach(({ link, section }) => {
        if (section === activeEntry.target) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-22% 0px -68% 0px', threshold: 0 });
    navigationSections.forEach(({ section }) => navigationObserver.observe(section));
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const telemetry = document.querySelector('[data-telemetry-lock]');
  if (telemetry && !reduceMotion.matches && 'IntersectionObserver' in window) {
    telemetry.classList.add('telemetry-armed');
    const telemetryObserver = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      telemetry.classList.add('telemetry-locked');
      telemetryObserver.disconnect();
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.2 });
    telemetryObserver.observe(telemetry);
  }
};

if (typeof document !== 'undefined') initSite();

// Top-left music player, styled like rachelqrwei.ca. Plays audio/le-festin.mp3 on a loop.
import { MUSIC } from './content.js?v=14';

const $ = (s) => document.querySelector(s);
const fmt = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};
const fillTo = (input) => input.style.setProperty('--p', `${(100 * Number(input.value)) / (Number(input.max) || 1)}%`);

const audio = new Audio();
audio.preload = 'metadata';
audio.loop = true;

export function pauseMusic() {
  audio.pause();
}

export function initMusic() {
  const root = $('#music');
  const play = $('#music-play');
  const mute = $('#music-mute');
  const bar = $('#music-bar');
  const vol = $('#music-vol');
  const cur = $('#music-cur');
  const dur = $('#music-dur');
  let seeking = false;

  $('#music-cover').src = MUSIC.cover;
  $('#music-title').textContent = MUSIC.title;
  $('#music-artist').textContent = MUSIC.artist;
  $('#music-link').href = MUSIC.url;
  audio.src = MUSIC.src;
  audio.volume = MUSIC.volume;
  vol.value = String(MUSIC.volume);
  fillTo(vol);

  const renderPlay = () => {
    root.classList.toggle('playing', !audio.paused);
    play.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music');
  };
  const renderTime = () => {
    if (seeking) return;
    bar.max = String(audio.duration || 1);
    bar.value = String(audio.currentTime);
    cur.textContent = fmt(audio.currentTime);
    fillTo(bar);
  };
  const renderVol = () => {
    const muted = audio.muted || audio.volume === 0;
    root.classList.toggle('muted', muted);
    mute.setAttribute('aria-label', muted ? 'Unmute' : 'Mute');
    vol.value = String(audio.muted ? 0 : audio.volume);
    fillTo(vol);
  };

  audio.addEventListener('loadedmetadata', () => { dur.textContent = fmt(audio.duration); renderTime(); });
  audio.addEventListener('timeupdate', renderTime);
  audio.addEventListener('play', renderPlay);
  audio.addEventListener('pause', renderPlay);
  audio.addEventListener('volumechange', renderVol);

  play.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));
  $('#music-restart').addEventListener('click', () => { audio.currentTime = 0; renderTime(); });
  mute.addEventListener('click', () => {
    if (audio.volume === 0) audio.volume = MUSIC.volume;
    audio.muted = !audio.muted;
  });
  vol.addEventListener('input', () => {
    audio.volume = Number(vol.value);
    audio.muted = audio.volume === 0;
  });
  bar.addEventListener('input', () => {
    seeking = true;
    cur.textContent = fmt(Number(bar.value));
    fillTo(bar);
  });
  bar.addEventListener('change', () => {
    audio.currentTime = Number(bar.value);
    seeking = false;
  });
  dur.textContent = fmt(0);
  renderPlay();
  renderVol();
}

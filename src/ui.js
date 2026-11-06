import { describe } from './layout.js';

export function mountUI(api) {
  document.querySelectorAll('.seg').forEach((seg) => {
    seg.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => api.set(seg.dataset.key, button.dataset.value));
    });
  });

  document.querySelectorAll('input[data-key]').forEach((input) => {
    input.addEventListener('change', () => api.set(input.dataset.key, input.checked));
  });

  document.querySelectorAll('[data-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.toggle;
      api.set(key, !button.classList.contains('on'));
    });
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => api.view(button.dataset.view));
  });

  document.querySelector('#note').addEventListener('input', (event) => {
    api.setNote(event.target.value.slice(0, 140));
  });
  document.querySelector('#copy-link').addEventListener('click', () => api.copyLink());
  document.querySelector('#reset').addEventListener('click', () => api.applyPreset('drawing'));

  function refresh(state, activeView) {
    document.querySelectorAll('.seg').forEach((seg) => {
      seg.querySelectorAll('button').forEach((button) => {
        button.classList.toggle('on', button.dataset.value === String(state[seg.dataset.key]));
      });
    });
    document.querySelectorAll('input[data-key]').forEach((input) => {
      input.checked = !!state[input.dataset.key];
    });
    document.querySelectorAll('[data-toggle]').forEach((button) => {
      button.classList.toggle('on', !!state[button.dataset.toggle]);
    });
    document.querySelectorAll('[data-view]').forEach((button) => {
      button.classList.toggle('on', button.dataset.view === activeView);
    });
    document.querySelector('#blurb').textContent = describe(state);
    const note = document.querySelector('#note');
    if (document.activeElement !== note && note.value !== state.note) note.value = state.note;
    const count = document.querySelector('#note-count');
    count.textContent = `${state.note.length}/140`;
  }

  return { refresh };
}

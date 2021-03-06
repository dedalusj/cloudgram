import {draw} from '../src/js/embed.js';

describe('errors', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="cy"></div>';
  });

  it('displays an error when no document is present in query', () => {
    draw();
    const errorEl = document.querySelector('#cy > p');
    expect(errorEl).not.toBeNull();
    expect(errorEl.classList.contains('error')).toBeTruthy();
    expect(errorEl.innerText.toLowerCase()).toContain('empty');
  });

  it('displays a parsing error', () => {
    history.replaceState({}, 'Embed', '/embed.html?document=diagram');

    draw();

    const errorEl = document.querySelector('#cy > p');
    expect(errorEl).not.toBeNull();
    expect(errorEl.classList.contains('error')).toBeTruthy();
    expect(errorEl.innerText.toLowerCase()).toContain('parse');
  });
});

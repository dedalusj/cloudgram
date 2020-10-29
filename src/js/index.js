import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-twilight';
import {saveAs} from 'file-saver';

import {parse} from './parser';
import {render} from './renderer';
import {Mode} from './editor/mode';

// exported to be mocked by tests
export const editor = ace.edit('editor', {
  theme: 'ace/theme/twilight',
  mode: new Mode(),
});

const displayErrors = errors => {
  if (!errors || errors.length === 0) {
    editor.getSession().setAnnotations([]);
  } else {
    editor.getSession().setAnnotations(
      errors.map(e => ({
        row: e.line.start - 1,
        column: e.column.start,
        text: e.message,
        type: 'error',
      }))
    );
  }
};

const getDocument = () => editor.getSession().getDocument().getValue();
const setDocument = doc => editor.setValue(doc, -1);

export const refresh = _ => {
  const src = getDocument();
  const {parsed, errors} = parse(src);

  displayErrors(errors);
  if (errors && errors.length > 0) return;

  window.cy = render(parsed);
};

export const saveGraph = _ => {
  const cy = window.cy;
  const selectEl = document.getElementById('format');
  const format = selectEl.options[selectEl.selectedIndex].value;

  let imgBlob;
  switch (format) {
    case 'jpeg':
      imgBlob = cy.jpg({output: 'blob'});
      break;
    case 'png':
      imgBlob = cy.png({output: 'blob'});
      break;
  }

  saveAs(imgBlob, `graph.${format}`);
};

export const copyToClipboard = text => {
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
};

export const copyLink = _ => {
  const src = getDocument();
  const url = `${location.protocol}//${location.host}${location.pathname}?document=${encodeURIComponent(src)}`;
  copyToClipboard(url);
};

const initDocument = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('document')) setDocument(params.get('document'));
};

document.addEventListener('DOMContentLoaded', function () {
  initDocument();

  editor.getSession().on('change', refresh);
  refresh();

  document.getElementById('save').addEventListener('click', saveGraph);
  document.getElementById('copy-link').addEventListener('click', copyLink);
});

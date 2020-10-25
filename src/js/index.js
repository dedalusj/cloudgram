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

export const refresh = _ => {
  const src = editor.getSession().getDocument().getValue();
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

const initDocument = () => {
  const params = new URLSearchParams(window.location.search);
  if (params.has('document')) editor.setValue(params.get('document'), -1);
};

document.addEventListener('DOMContentLoaded', function () {
  initDocument();

  editor.getSession().on('change', refresh);
  refresh();

  document.getElementById('save').addEventListener('click', saveGraph);
});

import ace from 'ace-builds';
import 'ace-builds/src-noconflict/theme-twilight';

import {parse} from './parser';
import {render} from './graph';
import {transform} from './transform';
import {Mode} from './editor/mode';

const editor = ace.edit('editor', {
  theme: 'ace/theme/twilight',
  mode: new Mode,
});

const displayErrors = errors => {
  if (!errors || errors.length === 0) {
    editor.getSession().setAnnotations([]);
  } else {
    editor.getSession().setAnnotations(errors.map(e => ({
      row: e.line.start - 1,
      column: e.column.start,
      text: e.message,
      type: "error"
    })));
  }
};

const refresh = _ => {
  const src = editor.getSession().getDocument().getValue();
  const {parsed, errors} = parse(src);

  displayErrors(errors);
  if (errors && errors.length > 0) return;

  const diagram = transform(parsed);
  render(diagram);
};

document.addEventListener('DOMContentLoaded', function() {
  editor.getSession().on('change', refresh);
  refresh();
});

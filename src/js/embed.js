import {drawDocument} from './draw';
import {getDocumentFromUrl} from './utils';

const displayError = ({message}) => {
  const errorEl = document.createElement('p');
  errorEl.classList.add('error');
  errorEl.innerText = message;
  document.getElementById('cy').appendChild(errorEl);
};

const emptyDocumentError = () => displayError({message: 'Empty document'});
const parseError = errors => displayError({message: `Document parse error: ${errors[0].message}`});

export const draw = () => {
  const src = getDocumentFromUrl();

  if (!src) {
    emptyDocumentError();
    return;
  }

  drawDocument(src, parseError);
};

document.addEventListener('DOMContentLoaded', draw);

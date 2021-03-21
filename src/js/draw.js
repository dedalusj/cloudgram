// parse the document and renders it
import {parse} from './parser';
import {render} from './renderer';

export const drawDocument = (src, errorsCallback = null) => {
  const {parsed, errors} = parse(src);

  if (errors && errors.length > 0) {
    errorsCallback(errors);
    return;
  }

  window.cy = render(parsed);
};

// parse the document and renders it
import {parse} from './parser';
import {render} from './renderer';
import {ParseError} from './types';

export const drawDocument = (src: string, errorsCallback?: (errors: ParseError[]) => void) => {
  const {parsed, errors} = parse(src);

  if (errorsCallback && errors && errors.length > 0) {
    errorsCallback(errors);
    return;
  }

  window.cy = render(parsed);
};

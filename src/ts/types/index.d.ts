import {CytoscapeSvg} from '../types';

export {};

declare global {
  interface Window {
    cy: CytoscapeSvg;
  }
}

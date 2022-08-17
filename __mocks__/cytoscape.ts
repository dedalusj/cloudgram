import {jest} from '@jest/globals';

const mockedCytoscape = jest.fn();

// @ts-ignore
mockedCytoscape.use = jest.fn();

export default mockedCytoscape;

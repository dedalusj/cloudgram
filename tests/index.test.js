import cytoscape from 'cytoscape';
import {saveAs} from 'file-saver';

jest.mock('cytoscape');
jest.mock('file-saver');

const validDocument = `
diagram "complete" {
  // creating the nodes
  aws.route53 dns;
  aws.cloudfront cf;
  aws.lambda edge;

  // creating the edges
  dns -> cf;
  cf -> edge;
}
`;

const invalidDocument = `
diagram "complete" {
  aws.route53 dns;
  aws.cloudfront cf;
  aws.lambda edge;

  // missing semi colon will generate an error
  dns -> cf
  cf -> edge;
}
`;

const svgContent = '<svg></svg>';
const blob = new Blob();
const svgBlob = new Blob([svgContent], {type: 'image/svg+xml;charset=utf-8'});

const mockCy = () => {
  const cy = {
    png: jest.fn().mockReturnValue(blob),
    jpg: jest.fn().mockReturnValue(blob),
    svg: jest.fn().mockReturnValue(svgContent),
  };

  const originalWindow = {...window};
  const windowSpy = jest.spyOn(global, 'window', 'get');
  windowSpy.mockImplementation(() => ({
    ...originalWindow,
    cy: cy,
  }));

  return cy;
};

describe('refresh', () => {
  let refresh;
  let editor;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '<div id="editor"></div>';

    // we require the index after mocking the document
    // body so that ace can find the editor div
    const index = require('../src/js/index');
    refresh = index.draw;
    editor = index.editor;
  });

  it('draws the diagram from the editor and reset errors', () => {
    const annotationSetter = jest.fn();
    jest.spyOn(editor, 'getSession').mockImplementation(() => ({
      getDocument: jest.fn().mockImplementation(() => ({
        getValue: jest.fn().mockImplementation(() => validDocument),
      })),
      setAnnotations: annotationSetter,
    }));

    refresh();

    const expectedElements = {
      nodes: [
        {
          data: {
            id: 'dns',
            label: 'dns',
            provider: 'aws',
            service: 'route53',
            parent: null,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: ['service'],
        },
        {
          data: {
            id: 'cf',
            label: 'cf',
            provider: 'aws',
            service: 'cloudfront',
            parent: null,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: ['service'],
        },
        {
          data: {
            id: 'edge',
            label: 'edge',
            provider: 'aws',
            service: 'lambda',
            parent: null,
            attributes: {},
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: true,
          classes: ['service'],
        },
      ],
      edges: [
        {
          data: {
            source: 'dns',
            target: 'cf',
            id: expect.any(String),
            label: null,
            attributes: {
              bidirectional: false,
            },
          },
        },
        {
          data: {
            source: 'cf',
            target: 'edge',
            id: expect.any(String),
            label: null,
            attributes: {
              bidirectional: false,
            },
          },
        },
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.any(Object),
      style: expect.any(Object),
    });

    expect(annotationSetter).toHaveBeenCalledWith([]);
  });

  it('shows errors in the editor', () => {
    const annotationSetter = jest.fn();
    jest.spyOn(editor, 'getSession').mockImplementation(() => ({
      getDocument: jest.fn().mockImplementation(() => ({
        getValue: jest.fn().mockImplementation(() => invalidDocument),
      })),
      setAnnotations: annotationSetter,
    }));

    refresh();

    expect(cytoscape).toHaveBeenCalledTimes(0);

    const expectedErrors = [
      {
        column: 3,
        row: 8,
        text: "Expecting --> ';' <-- but found --> 'cf' <--",
        type: 'error',
      },
    ];
    expect(annotationSetter).toHaveBeenCalledWith(expectedErrors);
  });
});

describe('save graph', () => {
  let cy;

  beforeEach(() => {
    jest.clearAllMocks();
    cy = mockCy();
  });

  it('saves the graph as png', () => {
    document.body.innerHTML = `
      <select id="format">
        <option selected="">png</option>
        <option>jpeg</option>
        <option>svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('../src/js/index').saveGraph();

    expect(cy.png).toHaveBeenCalledWith({output: 'blob', scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(blob, expect.stringMatching(/\.png$/));
  });

  it('saves the graph as jpg', () => {
    document.body.innerHTML = `
      <select id="format">
        <option>png</option>
        <option selected="">jpeg</option>
        <option>svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('../src/js/index').saveGraph();

    expect(cy.jpg).toHaveBeenCalledWith({output: 'blob', scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(blob, expect.stringMatching(/\.jpeg$/));
  });

  it('saves the graph as svg', () => {
    document.body.innerHTML = `
      <select id="format">
        <option>png</option>
        <option>jpeg</option>
        <option selected="">svg</option>
      </select>
      <div id="editor"></div>
    `;
    require('../src/js/index').saveGraph();

    expect(cy.svg).toHaveBeenCalledWith({scale: 1, full: true});
    expect(saveAs).toHaveBeenCalledWith(svgBlob, expect.stringMatching(/\.svg$/));
  });
});

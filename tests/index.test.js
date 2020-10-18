import cytoscape from 'cytoscape';

jest.mock('cytoscape');

const validDocument = `
diagram "complete" {
  // creating the nodes
  aws.route53 dns
  aws.cloudfront cf
  aws.lambda edge

  // creating the edges
  dns -> cf;
  cf -> edge;
}
`;

const invalidDocument = `
diagram "complete" {
  aws.route53 dns
  aws.cloudfront cf
  aws.lambda edge

  // missing semi colon will generate an error
  dns -> cf
  cf -> edge;
}
`;

describe('index', () => {
  let refresh;
  let editor;

  beforeEach(() => {
    jest.clearAllMocks();

    document.body.innerHTML = '<div id="editor"></div>';

    // we require the index after mocking the document
    // body so that ace can find the editor div
    const index = require('../src/js/index');
    refresh = index.refresh;
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
            parent: undefined,
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: false,
        },
        {
          data: {
            id: 'cf',
            label: 'cf',
            provider: 'aws',
            service: 'cloudfront',
            parent: undefined,
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: false,
        },
        {
          data: {
            id: 'edge',
            label: 'edge',
            provider: 'aws',
            service: 'lambda',
            parent: undefined,
          },
          selected: false,
          selectable: false,
          locked: false,
          grabbable: false,
        },
      ],
      edges: [
        {
          data: {
            source: 'dns',
            target: 'cf',
            id: expect.any(String),
          },
        },
        {
          data: {
            source: 'cf',
            target: 'edge',
            id: expect.any(String),
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

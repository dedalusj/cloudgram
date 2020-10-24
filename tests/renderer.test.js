import cytoscape from 'cytoscape';

import {render} from '../src/js/renderer';

jest.mock('cytoscape');

describe('renderer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures cytoscape to render a diagram', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
            {
              type: 'group',
              id: 'servers',
              attributes: {},
              parent: 'vpc',
              elements: [
                {type: 'node', id: 'server1', service: 'ec2', provider: 'aws', attributes: {}, parent: 'servers'},
                {type: 'node', id: 'server2', service: 'ec2', provider: 'aws', attributes: {}, parent: 'servers'},
              ],
            },
            {type: 'link', src: 'load_balancer', dst: 'servers', childrenPassThrough: false, attributes: {}},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'servers', label: 'servers', provider: null, service: null, parent: 'vpc'}),
        expectedNode({id: 'server1', label: 'server1', provider: 'aws', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', label: 'server2', provider: 'aws', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('links a node to a group children if requested', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
            {
              type: 'group',
              id: 'servers',
              attributes: {},
              parent: 'vpc',
              elements: [
                {type: 'node', id: 'server1', service: 'ec2', provider: 'aws', attributes: {}, parent: 'servers'},
                {type: 'node', id: 'server2', service: 'ec2', provider: 'aws', attributes: {}, parent: 'servers'},
              ],
            },
            {type: 'link', src: 'load_balancer', dst: 'servers', childrenPassThrough: true, attributes: {}},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'servers', label: 'servers', provider: null, service: null, parent: 'vpc'}),
        expectedNode({id: 'server1', label: 'server1', provider: 'aws', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', label: 'server2', provider: 'aws', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'server1', id: expect.any(String)}),
        expectedEdge({source: 'load_balancer', target: 'server2', id: expect.any(String)}),
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('links a node to a group if the group has no children', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
            {type: 'group', id: 'servers', attributes: {}, parent: 'vpc', elements: []},
            {type: 'link', src: 'load_balancer', dst: 'servers', childrenPassThrough: true, attributes: {}},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'servers', label: 'servers', provider: null, service: null, parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge sources', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'unknown',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: null, service: null, parent: null}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'unknown', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge targets', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'unknown',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: null, service: null, parent: null}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'unknown', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge ends', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {type: 'link', src: 'unknown1', dst: 'unknown2', childrenPassThrough: false, attributes: {}},
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
        expectedNode({id: 'unknown1', label: 'unknown1', provider: null, service: null, parent: null}),
        expectedNode({id: 'unknown2', label: 'unknown2', provider: null, service: null, parent: null}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'unknown1', target: 'unknown2', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('removes duplicate nodes keeping the first encountered', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
          ],
        },
        {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: null},
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('removes duplicate edges', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'LR'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
            {type: 'link', src: 'cf', dst: 'load_balancer', childrenPassThrough: false, attributes: {}},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'LR',
      }),
      style: expect.any(Array),
    });
  });

  it('sets the diagram direction correctly', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'TB'},
      elements: [
        {type: 'node', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null},
        {type: 'node', id: 'cf', service: 'cloudfront', provider: 'aws', attributes: {label: 'CDN'}, parent: null},
        {
          type: 'group',
          id: 'vpc',
          attributes: {color: 'green'},
          parent: null,
          elements: [
            {type: 'node', id: 'load_balancer', service: 'alb', provider: 'aws', attributes: {}, parent: 'vpc'},
          ],
        },
        {type: 'link', src: 'dns', dst: 'cf', childrenPassThrough: false, attributes: {color: 'blue', style: 'dashed'}},
        {
          type: 'link',
          src: 'cf',
          dst: 'load_balancer',
          childrenPassThrough: false,
          attributes: {color: 'blue', style: 'dashed'},
        },
      ],
    };

    render(diagram);

    const expectedNode = data => ({data, selected: false, selectable: false, locked: false, grabbable: false});
    const expectedEdge = data => ({data});
    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', label: 'dns', provider: 'aws', service: 'route53', parent: null}),
        expectedNode({id: 'cf', label: 'CDN', provider: 'aws', service: 'cloudfront', parent: null}),
        expectedNode({id: 'vpc', label: 'vpc', provider: null, service: null, parent: null}),
        expectedNode({id: 'load_balancer', label: 'load_balancer', provider: 'aws', service: 'alb', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'TB',
      }),
      style: expect.any(Array),
    });
  });
});

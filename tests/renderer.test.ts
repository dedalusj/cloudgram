import {jest} from '@jest/globals';
import cytoscape from 'cytoscape';

import {
  render,
  getBackgroundColor,
  getBorderStyle,
  getBorderWidth,
  getOpacity,
  getColor,
  getEdgeStyle,
  getEdgeWidth,
  getDirection,
  getHPosForNode,
  getVPosForNode,
  getSourceArrowStyle,
} from '../src/ts/renderer';

import {inputNode, inputGroup, inputEdge, expectedNode, expectedEdge} from './utils';
import {CytoscapeElements} from '../src/ts/types';

jest.mock('cytoscape');

describe('renderer', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('configures cytoscape to render a diagram', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup(
          'vpc',
          [
            inputNode('load_balancer', 'elasticLoadBalancing', {}),
            inputGroup('servers', [inputNode('server1', 'ec2', {}), inputNode('server2', 'ec2', {})], {}),
            inputEdge('load_balancer', 'servers'),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputEdge('dns', 'cf', false, false, {stroke: 'blue', style: 'dashed'}),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements: CytoscapeElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', provider: null, service: null, parent: 'vpc', classes: ''}),
        expectedNode({id: 'server1', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('links a node to a group children if requested', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup(
          'vpc',
          [
            inputNode('load_balancer', 'elasticLoadBalancing', {}),
            inputGroup('servers', [inputNode('server1', 'ec2', {}), inputNode('server2', 'ec2', {})], {}),
            inputEdge('load_balancer', 'servers', true, false, {stroke: 'blue', style: 'dashed'}),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputEdge('dns', 'cf', false),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', provider: null, service: null, parent: 'vpc', classes: ''}),
        expectedNode({id: 'server1', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({
          source: 'load_balancer',
          target: 'server1',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
        expectedEdge({
          source: 'load_balancer',
          target: 'server2',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
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
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('links a node to a group if the group has no children', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup(
          'vpc',
          [
            inputNode('load_balancer', 'elasticLoadBalancing', {}),
            inputGroup('servers', [], {}),
            inputEdge('load_balancer', 'servers', true),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputEdge('dns', 'cf', false, false, {stroke: 'blue', style: 'dashed'}),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', label: 'servers', provider: null, service: null, parent: 'vpc', classes: ''}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge sources', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {})], {attributes: {fill: 'green'}}),
        inputEdge('dns', 'cf', false),
        inputEdge('unknown', 'load_balancer', false, false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: 'generic', service: 'generic'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'unknown',
          target: 'load_balancer',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge targets', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {})], {attributes: {fill: 'green'}}),
        inputEdge('dns', 'cf', false),
        inputEdge('cf', 'unknown', false, false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: 'generic', service: 'generic'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'cf',
          target: 'unknown',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('automatically creates nodes for unknown edge ends', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {})], {attributes: {fill: 'green'}}),
        inputEdge('dns', 'cf', false),
        inputEdge('unknown1', 'unknown2', false, false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown1', label: 'unknown1', provider: 'generic', service: 'generic'}),
        expectedNode({id: 'unknown2', label: 'unknown2', provider: 'generic', service: 'generic'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'unknown1',
          target: 'unknown2',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('removes duplicate nodes keeping the first encountered', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {})], {attributes: {fill: 'green'}}),
        inputNode('load_balancer', 'elasticLoadBalancing', {}),
        inputEdge('dns', 'cf', false, false, {stroke: 'blue', style: 'dashed'}),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('removes duplicate edges', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {}), inputEdge('cf', 'load_balancer')], {
          attributes: {fill: 'green'},
        }),
        inputEdge('dns', 'cf', false, false, {stroke: 'blue', style: 'dashed'}),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false},
        }),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });

  it('sets the diagram direction correctly', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'tb'},
      elements: [inputNode('dns', 'route53', {})],
    };

    render(diagram);

    const expectedElements = {
      nodes: [expectedNode({id: 'dns', service: 'route53'})],
      edges: [],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'tb',
      }),
      style: expect.any(Array),
    });
  });

  it('defaults the direction to top bottom', () => {
    const diagram = {
      id: 'complete',
      attributes: {},
      elements: [inputNode('dns', 'route53', {})],
    };

    render(diagram);

    const expectedElements = {
      nodes: [expectedNode({id: 'dns', service: 'route53'})],
      edges: [],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'tb',
      }),
      style: expect.any(Array),
    });
  });

  it('uses top bottom for invalid direction', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'invalid'},
      elements: [inputNode('dns', 'route53', {})],
    };

    render(diagram);

    const expectedElements = {
      nodes: [expectedNode({id: 'dns', service: 'route53'})],
      edges: [],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'tb',
      }),
      style: expect.any(Array),
    });
  });

  it('respects empty labels', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'tb'},
      elements: [inputNode('dns', 'route53', {attributes: {label: ''}})],
    };

    render(diagram);

    const expectedElements = {
      nodes: [expectedNode({id: 'dns', label: '', service: 'route53', attributes: {label: ''}})],
      edges: [],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'tb',
      }),
      style: expect.any(Array),
    });
  });

  it('uses labels for edges if present', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [
        inputNode('dns', 'route53', {}),
        inputNode('cf', 'cloudfront', {attributes: {label: 'CDN'}}),
        inputGroup(
          'vpc',
          [
            inputNode('load_balancer', 'elasticLoadBalancing', {}),
            inputGroup('servers', [inputNode('server1', 'ec2', {}), inputNode('server2', 'ec2', {})], {}),
            inputEdge('load_balancer', 'servers'),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputEdge('dns', 'cf', false, false, {stroke: 'blue', style: 'dashed', label: 'edge'}),
        inputEdge('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: ''}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', provider: null, service: null, parent: 'vpc', classes: ''}),
        expectedNode({id: 'server1', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          label: 'edge',
          attributes: {stroke: 'blue', style: 'dashed', bidirectional: false, label: 'edge'},
        }),
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
      ],
    };

    expect(cytoscape).toHaveBeenCalledWith({
      boxSelectionEnabled: expect.any(Boolean),
      container: null, // null for testing since the DOM is not present
      elements: expectedElements,
      layout: expect.objectContaining({
        name: 'dagre',
        rankDir: 'lr',
      }),
      style: expect.any(Array),
    });
  });
});

describe('style properties', () => {
  const element = (attributes = {}, data = {}) => ({data: () => ({...data, attributes})});

  test.each([
    [getBackgroundColor, {fill: 'blue'}, 'blue'],
    [getBackgroundColor, {}, '#eee'],
    [getBorderStyle, {style: 'solid'}, 'solid'],
    [getBorderStyle, {}, 'dashed'],
    [getBorderWidth, {width: 5}, 5],
    [getBorderWidth, {}, 1],
    [getOpacity, {opacity: 0.1}, 0.1],
    [getOpacity, {}, 1.0],
    [getColor, {stroke: 'blue'}, 'blue'],
    [getColor, {}, '#ccc'],
    [getEdgeStyle, {style: 'solid'}, 'solid'],
    [getEdgeStyle, {}, 'solid'],
    [getEdgeWidth, {width: 5}, 5],
    [getEdgeWidth, {}, 2],
    [getHPosForNode, {labelPosition: 'n'}, 'center'],
    [getHPosForNode, {labelPosition: 's'}, 'center'],
    [getHPosForNode, {labelPosition: 'e'}, 'right'],
    [getHPosForNode, {labelPosition: 'w'}, 'left'],
    [getHPosForNode, {labelPosition: 'ne'}, 'right'],
    [getHPosForNode, {labelPosition: 'nw'}, 'left'],
    [getHPosForNode, {labelPosition: 'se'}, 'right'],
    [getHPosForNode, {labelPosition: 'sw'}, 'left'],
    [getHPosForNode, {}, 'center'],
    [getVPosForNode, {labelPosition: 'n'}, 'top'],
    [getVPosForNode, {labelPosition: 's'}, 'bottom'],
    [getVPosForNode, {labelPosition: 'e'}, 'center'],
    [getVPosForNode, {labelPosition: 'w'}, 'center'],
    [getVPosForNode, {labelPosition: 'ne'}, 'top'],
    [getVPosForNode, {labelPosition: 'nw'}, 'top'],
    [getVPosForNode, {labelPosition: 'se'}, 'bottom'],
    [getVPosForNode, {labelPosition: 'sw'}, 'bottom'],
    [getVPosForNode, {}, 'top'],
    [getSourceArrowStyle, {bidirectional: false}, 'none'],
    [getSourceArrowStyle, {bidirectional: true}, 'triangle'],
  ])(`%#`, (fn, attr, expected) => {
    const e = element(attr);
    expect(fn(e)).toEqual(expected);
  });

  it('gets directions', () => {
    expect(getDirection({direction: 'lr'})).toEqual('lr');
    expect(getDirection({direction: 'tb'})).toEqual('tb');
    expect(getDirection({direction: 'LR'})).toEqual('lr');
    expect(getDirection({direction: 'TB'})).toEqual('tb');
    expect(getDirection({direction: 'unknown'})).toEqual('tb');
    expect(getDirection({})).toEqual('tb');
  });
});

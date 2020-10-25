import cytoscape from 'cytoscape';

import {render} from '../src/js/renderer';

import {inputNode, inputGroup, inputLink, expectedNode, expectedEdge} from './utils';

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
            inputLink('load_balancer', 'servers'),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputLink('dns', 'cf', false, {stroke: 'blue', style: 'dashed'}),
        inputLink('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', provider: null, service: null, parent: 'vpc', classes: []}),
        expectedNode({id: 'server1', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
            inputLink('load_balancer', 'servers', true, {stroke: 'blue', style: 'dashed'}),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputLink('dns', 'cf', false),
        inputLink('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', provider: null, service: null, parent: 'vpc', classes: []}),
        expectedNode({id: 'server1', service: 'ec2', parent: 'servers'}),
        expectedNode({id: 'server2', service: 'ec2', parent: 'servers'}),
      ],
      edges: [
        expectedEdge({
          source: 'load_balancer',
          target: 'server1',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
        }),
        expectedEdge({
          source: 'load_balancer',
          target: 'server2',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
            inputLink('load_balancer', 'servers', true),
          ],
          {attributes: {fill: 'green'}}
        ),
        inputLink('dns', 'cf', false, {stroke: 'blue', style: 'dashed'}),
        inputLink('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'servers', label: 'servers', provider: null, service: null, parent: 'vpc', classes: []}),
      ],
      edges: [
        expectedEdge({source: 'load_balancer', target: 'servers', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
        inputLink('dns', 'cf', false),
        inputLink('unknown', 'load_balancer', false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: 'generic', service: 'unknown'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'unknown',
          target: 'load_balancer',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
        inputLink('dns', 'cf', false),
        inputLink('cf', 'unknown', false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown', label: 'unknown', provider: 'generic', service: 'unknown'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'cf',
          target: 'unknown',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
        inputLink('dns', 'cf', false),
        inputLink('unknown1', 'unknown2', false, {stroke: 'blue', style: 'dashed'}),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
        expectedNode({id: 'unknown1', label: 'unknown1', provider: 'generic', service: 'unknown'}),
        expectedNode({id: 'unknown2', label: 'unknown2', provider: 'generic', service: 'unknown'}),
      ],
      edges: [
        expectedEdge({source: 'dns', target: 'cf', id: expect.any(String)}),
        expectedEdge({
          source: 'unknown1',
          target: 'unknown2',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
        inputLink('dns', 'cf', false, {stroke: 'blue', style: 'dashed'}),
        inputLink('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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
        inputGroup('vpc', [inputNode('load_balancer', 'elasticLoadBalancing', {}), inputLink('cf', 'load_balancer')], {
          attributes: {fill: 'green'},
        }),
        inputLink('dns', 'cf', false, {stroke: 'blue', style: 'dashed'}),
        inputLink('cf', 'load_balancer', false),
      ],
    };

    render(diagram);

    const expectedElements = {
      nodes: [
        expectedNode({id: 'dns', service: 'route53'}),
        expectedNode({id: 'cf', label: 'CDN', service: 'cloudfront', attributes: {label: 'CDN'}}),
        expectedNode({id: 'vpc', provider: null, service: null, attributes: {fill: 'green'}, classes: []}),
        expectedNode({id: 'load_balancer', service: 'elasticLoadBalancing', parent: 'vpc'}),
      ],
      edges: [
        expectedEdge({source: 'cf', target: 'load_balancer', id: expect.any(String)}),
        expectedEdge({
          source: 'dns',
          target: 'cf',
          id: expect.any(String),
          attributes: {stroke: 'blue', style: 'dashed'},
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

  it('throws an error for unknown elements', () => {
    const diagram = {
      id: 'complete',
      attributes: {direction: 'lr'},
      elements: [{type: 'unknown', id: 'dns', service: 'route53', provider: 'aws', attributes: {}, parent: null}],
    };

    expect(() => render(diagram)).toThrow();
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
});

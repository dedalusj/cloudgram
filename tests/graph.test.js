import {elementsConfig, layoutConfig, styleConfig} from "../src/js/graph";

const randomString = () => Math.random().toString(36).substring(7);
const randomItem = items => items[Math.floor(Math.random() * items.length)];
const randomProvider = () => randomItem(["aws", "google", "generic"]);
const randomService = () => randomItem(["route53", "ec2", "s3"]);
const randomNode = () => ({
    id: randomString(),
    provider: randomProvider(),
    service: randomService(),
});

describe("elements", () => {
   test("it generates elements from a diagram", () => {
       const nodes = Array(4).fill(1).map(() => randomNode());
       nodes[1]['parent'] = nodes[0].id;
       const edges = [{src: nodes[0].id, dst: nodes[1].id}, {src: nodes[1].id, dst: nodes[2].id}];
       const diagram = {id: "d", nodes, edges};
       expect(elementsConfig(diagram)).toMatchObject({
           nodes: [
               {data: {...nodes[0], label: nodes[0].id}, selected: false, selectable: false, locked: false, grabbable: false},
               {data: {...nodes[1], label: nodes[1].id}, selected: false, selectable: false, locked: false, grabbable: false},
               {data: {...nodes[2], label: nodes[2].id}, selected: false, selectable: false, locked: false, grabbable: false},
               {data: {...nodes[3], label: nodes[3].id}, selected: false, selectable: false, locked: false, grabbable: false},
           ],
           edges: [
               {data: {source: edges[0].src, target: edges[0].dst, id: expect.any(String)}},
               {data: {source: edges[1].src, target: edges[1].dst, id: expect.any(String)}},
           ],
       });
   });
});

describe("layout", () => {
   test("it creates a directed layout", () => {
       expect(layoutConfig()).toMatchObject({name: 'dagre', rankDir: expect.anything()});
   });
});

describe("style", () => {
    test("it creates style for all type", () => {
        expect(styleConfig()).toMatchObject([
            {
                selector: 'node',
                style: {
                    width: expect.any(Number),
                    height: expect.any(Number),
                    shape: expect.any(String),
                    label: expect.any(String),
                    'background-image': expect.any(Function),
                },
            },
            {
                selector: 'edge',
                style: {
                    width: expect.any(Number),
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'source-endpoint': 'outside-to-node-or-label',
                    'target-endpoint': 'outside-to-node-or-label',
                },
            },
            {selector: ':parent', style: expect.any(Object)},
        ]);
    });
});

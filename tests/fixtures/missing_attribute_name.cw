diagram "missing_attribute_name" [direction=lr] {
  // creating the nodes
  aws.route53 dns [label="DNS"];
  aws.cloudfront cf [label="CDN"];

  group vpc [="g"] {
      aws.elasticLoadBalancing load_balancer [label="Load balancer"];

      group servers [label="Servers"] {
          aws.ec2 server1 [label="Server 1"];
          aws.ec2 server2 [label="Server 2"];
      }
  }

  // creating the edges
  dns -> cf -> load_balancer [color=blue, style=dashed];
  load_balancer => servers;
}

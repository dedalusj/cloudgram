diagram "complete" [direction=lr] {
  // creating the nodes
  aws.route53 "dns";
  generic.component cf [label="CDN"];

  group vpc [fill=green] {
      gcp.loadBalancing load_balancer;

      group servers {
          k8s.node server1;
          azure.virtualMachine server2;
      }
  }

  // creating the edges
  dns -> cf -> load_balancer [color=blue, style=dashed];
  load_balancer => servers;
}

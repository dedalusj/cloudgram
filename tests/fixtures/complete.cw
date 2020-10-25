diagram "complete" [direction=lr] {
  // creating the nodes
  aws.route53 "dns";
  aws.cloudfront cf [label="CDN"];

  group vpc [fill=green] {
      aws.alb load_balancer;

      group servers {
          aws.ec2 server1;
          aws.ec2 server2;
      }
  }

  // creating the edges
  dns -> cf -> load_balancer [color=blue, style=dashed];
  load_balancer => servers;
}

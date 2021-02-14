diagram "complete" [direction=lr] {
  aws.route53 "dns";

  group vpc [fill="#666"] {
      aws.alb load_balancer;
  }

  dns -> load_balancer;
}

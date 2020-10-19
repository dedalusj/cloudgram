diagram "complete" {
  // creating the nodes
  aws.route53 "dns"
  aws.cloudfront cf {
      aws.lambda edge
      aws.ec2 elb
  }

  // creating the edges
  dns -> cf => elb;
  cf => edge;
}

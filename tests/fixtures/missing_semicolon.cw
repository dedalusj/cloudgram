diagram "missing_semicolon" {
  aws.route53 "dns"
  aws.cloudfront "cf"
  aws.alb "lb"

  dns -> cf
  cf -> lb;
}

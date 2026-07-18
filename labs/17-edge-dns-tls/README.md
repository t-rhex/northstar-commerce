# Lab 17: Edge routing, DNS, and TLS

## Outcome

Expose Northstar through an AWS-managed edge while keeping services private and certificate renewal automatic.

## Work

Install AWS Load Balancer Controller through Helm with Pod Identity. Deploy HTTP first using ALB IP targets, then inspect target health and controller events. Install compatible Gateway API CRDs and build a `Gateway`/`HTTPRoute` path for the new design; retain `networking.k8s.io/v1 Ingress` as a legacy comparison because Ingress is frozen.

If you own a domain, request an ACM certificate with DNS validation, preserve its CNAME, and create a Route 53 `A` alias to the ALB. Enforce HTTPS and validate certificate chain, hostname, renewal eligibility, and security policy. Learners without a domain complete the HTTP path and document the TLS plan.

## Evidence and gate

Submit controller version, accepted/programmed route status, ALB targets, DNS answer, TLS result, and request path to `gateway`. Never share an IngressGroup across untrusted teams or edit controller-owned ALBs manually.

[AWS Load Balancer Controller install](https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html) · [ACM DNS validation](https://docs.aws.amazon.com/acm/latest/userguide/dns-validation.html)

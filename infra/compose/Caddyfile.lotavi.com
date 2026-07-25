# Production marketing + API hosts for Lotavi
# Enable when DNS/TLS for lotavi.com is live.

lotavi.com, www.lotavi.com {
  encode gzip

  # www → apex
  @www host www.lotavi.com
  redir @www https://lotavi.com{uri} permanent

  handle {
    reverse_proxy web:3000
  }
}

app.lotavi.com {
  encode gzip
  reverse_proxy web:3000
}

api.lotavi.com {
  encode gzip
  reverse_proxy api:4000
}

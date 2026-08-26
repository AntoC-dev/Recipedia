#!/bin/bash

# Maestro serialises every `-e` variable into the debug output it uploads as an artifact.

E2E_SECRET_ENV_VARS="QUITOQUE_USERNAME QUITOQUE_PASSWORD"
E2E_CREDENTIAL_SUITES="web"
E2E_SECRET_MIN_LENGTH=6

e2e_secret_variants() {
  local value="$1"

  if [ -z "$value" ]; then
    return 0
  fi

  # Too short to grep for without matching unrelated text — say so instead of passing silently.
  if [ ${#value} -lt "$E2E_SECRET_MIN_LENGTH" ]; then
    echo "::warning::A credential is shorter than $E2E_SECRET_MIN_LENGTH characters — it is neither redacted nor scanned for" >&2
    return 0
  fi

  SECRET_VALUE="$value" perl -e '
    my $raw = $ENV{SECRET_VALUE};

    my $url = $raw;
    $url =~ s/([^A-Za-z0-9\-._~])/sprintf("%%%02X", ord($1))/ge;

    # commands.json stores the value JSON-escaped, report.xml stores it XML-escaped.
    my $json = $raw;
    $json =~ s/(["\\])/\\$1/g;
    $json =~ s/([\x00-\x1f])/sprintf("\\u%04x", ord($1))/ge;

    my $xml = $raw;
    $xml =~ s/&/&amp;/g;
    $xml =~ s/</&lt;/g;
    $xml =~ s/>/&gt;/g;
    $xml =~ s/"/&quot;/g;
    $xml =~ s/'"'"'/&apos;/g;

    my %seen;
    for my $variant ($raw, $url, $json, $xml) {
      next if $variant eq q{} || $seen{$variant}++;
      print "$variant\n";
    }
  '
}

maestro_credential_args() {
  local suite="$1"
  local allowed
  local name

  MAESTRO_CREDENTIAL_ARGS=()

  for allowed in $E2E_CREDENTIAL_SUITES; do
    if [ "$suite" = "$allowed" ]; then
      for name in $E2E_SECRET_ENV_VARS; do
        MAESTRO_CREDENTIAL_ARGS+=(-e "${name}=${!name}")
      done
      return 0
    fi
  done
}

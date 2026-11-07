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

  SECRET_VALUE="$value" SECRET_MIN_LENGTH="$E2E_SECRET_MIN_LENGTH" perl -e '
    sub escapings {
      my ($raw) = @_;

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

      return ($raw, $url, $json, $xml);
    }

    my $raw = $ENV{SECRET_VALUE};
    my @pieces = ($raw);
    # The iOS driver types the first character apart from the rest, which is logged on its own.
    my $tail = substr($raw, 1);
    push @pieces, $tail if length($tail) >= $ENV{SECRET_MIN_LENGTH};

    my %seen;
    for my $variant (map { escapings($_) } @pieces) {
      next if $variant eq q{} || $seen{$variant}++;
      print "$variant\n";
    }
  '
}

# Runs typed-text-filter.pl in MODE (redact|check) over the files under PATHS holding one of its
# markers: device logs run to GBs, so only those are read. Returns non-zero if a file can't be scanned.
e2e_typed_text_filter() {
  local mode="$1"
  shift
  local filter
  filter="$(dirname "${BASH_SOURCE[0]}")/typed-text-filter.pl"

  local list
  local status=0
  list=$(LC_ALL=C grep -rlF --exclude='*.png' --exclude='*.jpg' --exclude='*.mp4' \
    -f <(perl "$filter" markers) -- "$@") || status=$?
  [ "$status" -le 1 ] || return "$status"
  [ -n "$list" ] || return 0

  local files=()
  local file
  while IFS= read -r file; do
    files+=("$file")
  done <<< "$list"

  LC_ALL=C perl "$filter" "$mode" "${files[@]}"
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

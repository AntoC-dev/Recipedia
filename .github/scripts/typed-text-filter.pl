#!/usr/bin/perl
# Usage: typed-text-filter.pl markers | redact FILE... | check FILE...
# Device logs echo every inputText payload, split or per keystroke, so no whole-value match can
# catch them: blank the payload of each line shape that carries typed text, whatever its value.
# markers prints the fixed strings callers grep to pre-select files; redact rewrites the files in
# place; check names the files still holding such a payload.

use strict;
use warnings;

my $PLACEHOLDER = '***REDACTED***';

# One fixed string per line shape scrub handles: a line holding none of them is left untouched.
my @MARKERS = ('] Typing ', '[TextInputHelper] ', "Type '", 'Inputting text: ', 'Pressing keycodes ', ' Skipping invisible child: ');

sub scrub {
  my ($line) = @_;
  return $line unless grep { index($line, $_) >= 0 } @MARKERS;
  # Android Maestro dumps every accessibility node, typed field text included, while it polls.
  return q{} if $line =~ / Skipping invisible child: /;
  # iOS testmanagerd: XCTest echoes each typed chunk.
  $line =~ s/(\] Typing )(?!complete, replying to client\.\r?$)[^\r\n]+/$1$PLACEHOLDER/;
  # iOS Maestro driver: the first character and the remainder, typed apart.
  $line =~ s/(\[TextInputHelper\] [^:\r\n]+: )[^\r\n]+/$1$PLACEHOLDER/;
  # XCTest activity log.
  $line =~ s/(\bType ').*(' into )/$1$PLACEHOLDER$2/;
  # maestro.log on both platforms.
  $line =~ s/(Inputting text: )[^\r\n]+/$1$PLACEHOLDER/;
  # Android UiDevice: one keycode per typed character, the modifier giving its case.
  $line =~ s/(Pressing keycodes )\[[^\]\r\n]*\](?: with modifier \d+)?/$1\[$PLACEHOLDER\]/;
  return $line;
}

my $mode = shift @ARGV // q{};

if ($mode eq 'markers') {
  print "$_\n" for @MARKERS;
  exit 0;
}

if ($mode eq 'redact') {
  local $^I = q{};
  while (my $line = <>) {
    print scrub($line);
  }
  exit 0;
}

if ($mode eq 'check') {
  my $leaked = 0;
  for my $file (@ARGV) {
    open my $handle, '<', $file or die "Cannot read $file: $!\n";
    my $count = 0;
    while (my $line = <$handle>) {
      $count++ if scrub($line) ne $line;
    }
    close $handle;
    next unless $count;
    $leaked = 1;
    print "   $file ($count line(s))\n";
  }
  exit $leaked;
}

die "Usage: $0 markers | redact FILE... | check FILE...\n";

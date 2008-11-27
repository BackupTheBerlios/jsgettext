new JSAN('./lib').use('Test.More');
plan({tests: 2});

JSAN.addRepository('../lib').use('Gettext');
ok(1);

ok(typeof(Gettext) != 'undefined');

ok(Gettext.context_glue == "\004");


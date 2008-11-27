new JSAN('./lib').use('Test.More');
plan({tests: 2});

JSAN.addRepository('../lib').use('Gettext');

var json_locale_data = {
    'messages' : {
        '' : { 
            'domain'        : 'messages',
            'lang'          : 'en',
            'plural-forms'  : "nplurals=2; plural=(n != 1);"
            },
        'test' : 'XXtestXX'
        }
    };  
    
ok(typeof(Gettext) != 'undefined');

var gt = new Gettext({ 'domain' : 'messages', 'locale_data' : json_locale_data });
ok(typeof(gt) != 'undefined');


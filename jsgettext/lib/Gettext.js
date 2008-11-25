/*
Pure Javascript implementation of Uniforum message translation.
Copyright (C) 2008 Joshua I. Miller <unrtst@gmail.com>, all rights reserved

This program is free software; you can redistribute it and/or modify it
under the terms of the GNU Library General Public License as published
by the Free Software Foundation; either version 2, or (at your option)
any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Library General Public License for more details.

You should have received a copy of the GNU Library General Public
License along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307,
USA.

=head1 NAME

Javascript Gettext - Javascript implemenation of GNU Gettext API.

=head1 SYNOPSIS

    // //////////////////////////////////////////////////////////
    // Optimum caching way
    <script language="javascript" src="/path/LC_MESSAGES/myDomain.json"></script>
    <script language="javascript" src="/path/Gettext.js'></script>

    // assuming myDomain.json defines variable json_locale_data
    var params = {  "domain" : "myDomain",
                    "locale_data" : json_locale_data
                 };
    var gt = new Gettext(params);
    // create a shortcut if you'd like
    function _ (msgid) { return gt.gettext(msgid); }
    alert(_("some string"));
    // or use fully named method
    alert(gt.gettext("some string"));


    // //////////////////////////////////////////////////////////
    // The other way to load the language lookup is a "link" tag
    // Downside is that the data won't be cached
    // Upside is that it's easy to specify multiple files
    <link rel="gettext" uri="/path/LC_MESSAGES/myDomain.json" />
    <script language="javascript" src="/path/Gettext.js'></script>

    var gt = new Gettext('myDomain');
    // rest is the same


    // //////////////////////////////////////////////////////////
    // The reson the shortcuts aren't exported by default is because they'd be
    // glued to the single domain you created. So, if you're adding i18n support
    // to some js library, you should use it as so:

    if (typeof(MyNamespace) == 'undefined') MyNamespace = {};
    MyNamespace.MyClass = function () {
        var gtParms = { "domain" : 'MyNamespace_MyClass' };
        this.gt = new Gettext(gtParams);
        return this;
    };
    MyNamespace.MyClass.prototype._ = function (msgid) {
        return this.gt.gettext(msgid);
    };
    MyNamespace.MyClass.prototype.something = function () {
        var myString = this._("this will get translated");
    };

    // //////////////////////////////////////////////////////////
    // Data structure of the json data
    // NOTE: if you're loading via the <script> tag, you can only
    // load one file, but it can contain multiple domains.
    var json_locale_data = {
        "MyDomain" : {
            "" : {
                "header_key" : "header value",
                "header_key" : "header value",
            "msgid" : [ "msgid_plural", "msgstr", "msgstr_plural", "msgstr_pluralN" ],
            "msgctxt\004msgid" : [ "", "msgstr" ],
            },
        "AnotherDomain" : {
            },
        }

=head1 DESCRIPTION

This is a javascript implementation of GNU Gettext, providing internationalization support for javascript. It will differ from existing implementations in that it will support all current Gettext features (ex. plural and context support), and will also support loading language catalogs from .mo, .po, or preprocessed json files (converter included).


=head1 INSTALL

To install this module, simply copy the file lib/Gettext.js to a web accessable location, and reference it from your application.


=head1 BUGS / TODO

=over

=item proprietary ajax library in use

Currently, this uses CCMS.HttpRequest for the ajax calls. As this is a public module, we'll want to remove that dependancy, integrating the code in here, or using a different public library (possible AJAX.js from JSAN).

=item ajax asynx delay on language file loading

If you load your language files via the <link rel=...> method, which uses ajax to fetch the data, there will be an unknown amount of time between when you first call "new Gettext", and when the language has finished loading. If you immediately make a gettext call afterwards, it will likely not have loaded, and your translation will come back w/ the default english text. This is because the ajax call is made asyncronously.

It's recommended to ues the statically defined <script...> method, but if you insist, you may inspect the value of GettextJsonObject.lang_data_loaded. If true, at least one language file has completely loaded.

=item domain support

domain support. We need to figure out how we're going to handle that across the board.

In CCMS, with the i18n calls, they currently do nothing to distinguish between domains. For that, saying "hey, it's all 'ccms'" may be ok (though zoneinfo would be nice to separate out).

In javascript, we run into a problem, because the namespace is essentially global. If we create a new i18n object, and use that, then that'd be ok... but that means a different calling convention than everthing else. The problem really lies with making the shortcuts ( _("str") or i18n("str") ).

Maybe we can force our apps to do:
    this.i18n("str")

In our i18n wrapper lib, we could do the API like this:

    // in some other .js file that needs i18n
    this.i18nObj = new i18n;
    this.i18n = this.i18nObj.init('domain');

This really goes back to the crazy setup stuff that happens in all of these, and I'm basically trying to reinvent the wheel so it fits in javascript.

=back

=head1 CONFIGURATION

Configure in one of two ways:
1. Optimal. Load language definition from statically defined json data.

    <script language="javascript" src="/path/locale/domain.json"></script>

    // in domain.json
    json_locale_data = {
        "mydomain" : {
            // po header fields
            "" : {
                "plural_forms" : "...",
                "lang" : "en",
                },
            // all the msgid strings and translations
            "msgid" : [ "msgid_plural", "translation", "plural_translation" ],
        },
    };
    // please see the included po2json script for the details on this format

The following methods are implemented:

    gettext
    dgettext
    dcgettext
    ngettext
    dngettext
    dcngettext
    pgettext
    dpgettext
    dcpgettext
    npgettext
    dnpgettext
    dcnpgettext

TODO:

May want to do the textdomain stuff to, and implement it as a multi-level hash in the json files. They'll need namespace either way.

May want to add encoding/reencoding stuff.

*/

// "domain" is the Gettext domain, not www.whatev.com. It's usually
// your applications basename.
Gettext = function (args) {
    this.domain      = 'messages';
    this.locale_data = undefined;
    this.lang_data_loaded  = false;

    // set options
    var options = [ "domain", "locale_data" ];
    if (typeof(args) == "object") {
        for (var i in args) {
            for (var j=0; j<options.length; j++) {
                if (i == options[j]) {
                    this[i] = args[i];
                }
            }
        }
    }

    // try to load the lang file from somewhere
    this.try_load_lang();

    return this;
}

Gettext.context_glue = "\004";

Gettext.prototype.try_load_lang = function() {
    if (this.ran_lang_load) return;

    // check to see if language is statically included
    if (typeof(this.locale_data) != 'undefined') {
        // we're going to reformat it, and overwrite the variable
        var locale_copy = this.locale_data;
        this.locale_data = undefined;
        this.parse_locale_data(locale_copy);
        this.ran_lang_load = 1;
        this.lang_data_loaded = true;

    // try loading from JSON
    } else {
        // get lang links
        var lang_link = this.get_lang_refs();
        if (typeof(lang_link) == 'object' && lang_link.length > 0) {
            // NOTE: there will be a delay here, as this is async.
            // So, any i18n calls made right after page load may not
            // get translated.
            // XXX: we may want to see if we can "fix" this behavior
            for (var i=0; i<lang_link.length; i++) {
                this.try_load_lang_json(lang_link[i]);
            }
            this.ran_lang_load = 1;
        } else {
            this.ran_lang_load = 1;
        }
    }
};

// This takes the po2json'd data, and moves it into an internal form
// for use in our lib, and puts it in our object as:
//  this.locale_data = {
//      domain : {
//          head : { headfield : headvalue },
//          msgs : {
//              msgid : [ msgid_plural, msgstr, msgstr_plural ],
//          },
Gettext.prototype.parse_locale_data = function(locale_data) {
    if (typeof(this.locale_data) == 'undefined') {
        this.locale_data = { };
    }

    // suck in every domain defined in the supplied data
    for (var domain in locale_data) {
        // skip empty specs
        if (typeof(locale_data[domain]) == 'undefined') continue;
        // skip if it has no msgid's
        var has_msgids = false;
        for (var msgid in locale_data[domain]) {
            has_msgids = true;
            break;
        }
        if (! has_msgids) continue;

        // grab shortcut to data
        var data = locale_data[domain];

        // if they specifcy a blank domain, default to "messages"
        if (domain == "") domain = "messages";
        // init the data structure
        if (typeof(this.locale_data[domain]) == 'undefined') {
            this.locale_data[domain] = { };
        }
        if (typeof(this.locale_data[domain].head) == 'undefined') {
            this.locale_data[domain].head = { };
            this.locale_data[domain].msgs = { };
        }

        for (var key in data) {
            if (key == "") {
                var header = data[key];
                for (var head in header) {
                    this.locale_data[domain].head[head] = header[head];
                }
            } else {
                this.locale_data[domain].msgs[key] = data[key];
            }
        }
    }

    // build the plural forms function
    for (var domain in this.locale_data) {
        if (typeof(this.locale_data[domain].head.plural_forms) != 'undefined' &&
            typeof(this.locale_data[domain].head.plural_func) == 'undefined') {
            // TODO: this needs fixed up with stuff to build the actual func
            this.locale_data[domain].head.plural_func = function (n) {
                var p = (n != 1) ? 1 : 0;
                return p;
                };
        } else if (typeof(this.locale_data[domain].head.plural_func) == 'undefined') {
            this.locale_data[domain].head.plural_func = function (n) {
                var p = (n != 1) ? 1 : 0;
                return p;
                };
        } // else, plural_func already created
    }

    return;
};


// XXX: this is going to be a fucking problem.
// I want this to be a public module, but I need an xmlhttp request
// feature (I'm using CCMS.HttpRequest). I'll need to replace that
// with built-in stuff, or use a public module.

// try_load_lang_json : do an ajaxy call to load in the lang defs
Gettext.prototype.try_load_lang_json = function(uri) {
    var params = new Array();
    params["async"] = true;
    params["baseurl"] = uri;
    params["data"] = new Array();
    var callback = function(xmlhttp, args) {
// TODO: this is like this because I'm loading from files, not a webserver
        var ok_status_codes = new Array();
        ok_status_codes[0] = 0;
        ok_status_codes[1] = 200;
        if (xmlhttp.StatusError(ok_status_codes)) {
            xmlhttp.HandleStatusError();
            return;
        }
        var rv = xmlhttp.JSON();
        // call back into the calling instance
        args["parent"].parse_locale_data(rv);
        args["parent"].lang_data_loaded = true;
    };
    params["callback"]      = callback;
    // pass in our object, so we can call back into this instance.
    params["callback_args"] = { "parent" : this };
    var xmlhttp = new CCMS.HttpRequest();
    xmlhttp.Fetch(params);
};

// this finds all <link> tags, filters out ones that match our
// specs, and returns a list of hashes of those
Gettext.prototype.get_lang_refs = function() {
    var langs = new Array();
    var links = document.getElementsByTagName("link");
    // find all <link> tags in dom; filter ours
    for (var i=0; i<links.length; i++) {
        if (links[i].rel == 'gettext' && links[i].href) {
            langs.push(links[i].href);
        }
    }
    return langs;
};


// gettext
Gettext.prototype.gettext = function (msgid) {
    var msgctxt;
    var msgid_plural;
    var n;
    var category;
    return this.dcnpgettext(undefined, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dgettext = function (domain, msgid) {
    var msgctxt;
    var msgid_plural;
    var n;
    var category;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dcgettext = function (domain, msgid, category) {
    var msgctxt;
    var msgid_plural;
    var n;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

// ngettext
Gettext.prototype.ngettext = function (msgid, msgid_plural) {
    var msgctxt;
    var category;
    return this.dcnpgettext(undefined, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dngettext = function (domain, msgid, msgid_plural) {
    var msgctxt;
    var category;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dcngettext = function (domain, msgid, msgid_plural, category) {
    var msgctxt;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category, category);
};

// pgettext
Gettext.prototype.pgettext = function (msgctxt, msgid) {
    var msgid_plural;
    var n;
    var category;
    return this.dcnpgettext(undefined, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dpgettext = function (domain, msgctxt, msgid) {
    var msgid_plural;
    var n;
    var category;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dcpgettext = function (domain, msgctxt, msgid, category) {
    var msgid_plural;
    var n;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

// npgettext
Gettext.prototype.npgettext = function (msgctxt, msgid, msgid_plural, n) {
    var category;
    return this.dcnpgettext(undefined, msgctxt, msgid, msgid_plural, n, category);
};

Gettext.prototype.dpgettext = function (domain, msgctxt, msgid, msgid_plural, n) {
    var category;
    return this.dcnpgettext(domain, msgctxt, msgid, msgid_plural, n, category);
};

// this has all the options, so we use it for all of them.
Gettext.prototype.dcnpgettext = function (domain, msgctxt, msgid, category, msgid_plural, n, category) {
    if (typeof(msgid) == 'undefined') return '';

    var plural = (typeof(msgid_plural) == 'undefined') ? false : true;
    var msg_ctxt_id = (typeof(msgctxt) == 'undefined') ? msgid :
                                msgctxt+this.context_glue+msgid;

    var domainname = (typeof(domain) != 'undefined')      ? domain :
                     (typeof(this.domain) != 'undefined') ? this.domain :
                                                            'messages';

    // category is always LC_MESSAGES. We ignore all else
    var category_name = 'LC_MESSAGES';
    var category = 5;

    var locale_data = new Array();
    if (typeof(this.locale_data) != 'undefined' &&
        typeof(this.locale_data[domainname]) != 'undefined') {
        locale_data.push( this.locale_data[domainname] );

    } else {
        // didn't find domain we're looking for. Search all of them.
        for (var dom in this.locale_data) {
            locale_data.push( this.locale_data[dom] );
        }
    }

    var trans = [];
    var found = false;
    var domain_used; // so we can find plural_forms if needed
    if (locale_data.length) {
        for (var i=0; i<locale_data.length; i++) {
            var locale = locale_data[i];
            if (typeof(locale.msgs[msg_ctxt_id]) != 'undefined') {
                // make copy of that array (cause we'll be destructive)
                for (var j=0; j<locale.msgs[msg_ctxt_id].length; j++) {
                    trans[j] = locale.msgs[msg_ctxt_id][j];
                }
                trans.shift(); // throw away the msgid_plural
                domain_used = locale;
                found = true;
                break;
            }
        }
    }

    // default to english if we lack a match
    if (! trans.length) {
        trans = [ msgid, msgid_plural ];
    }

    var translation = trans[0];
    if (plural) {
        var p;
        if (found) {
            var rv = domain_used.plural_func(n);
            if (! rv.plural) rv.plural = 0;
            if (! rv.nplural) rv.nplural = 0;
            // if plurals returned is out of bound for total plural forms
            if (rv.nplural <= rv.plural) rv.plural = 0;
            p = rv.plural;
        } else {
            p = (n != 1) ? 1 : 0;
        }
        if (typeof(trans[p]) != 'undefined')
            translation = trans[p];
    }

    return translation;
};


/* verify that something is an array */
Gettext.prototype.isArray = function (thisObject) {
    return this.isValidObject(thisObject) && thisObject.constructor == Array;
};


/*

=head1 REQUIRES

po2json requires perl, and the perl modules Locale::PO and JSON.

=head1 SEE ALSO

Locale::gettext_pp(3pm), POSIX(3pm), gettext(1), gettext(3)

=head1 AUTHOR

Copyright (C) 2008, Joshua I. Miller E<lt>unrtst@gmail.comE<gt>, all rights reserved. See the source code for details.

*/

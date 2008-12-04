.PHONY: all clean install

SOURCE=../lib/Gettext.js
DEMO=../examples/normal/index.html
PREFIX?=/home/groups/jsgettext

all:htdocs/doc/html/Gettext.html htdocs/lib/Gettext.js htdocs/demo/index.html htdocs/tests

install: $(PREFIX) all
	find htdocs -path "*/CVS" -prune -o ! -name ".*" -print | \
	cpio -o | \
	(cd $< ; cpio -i )

htdocs/tests:
	mkdir -p $@
	cd ../ && \
	find tests -path "*/CVS" -prune -o ! -name ".*" -print | \
	cpio -o | \
	(cd website/htdocs && cpio -i )

htdocs/lib/Gettext.js: $(SOURCE) htdocs/lib
	cp $< $@

htdocs/doc/html/Gettext.html: $(SOURCE) htdocs/doc/html
	pod2html $< > $@
	rm pod2htm*.tmp

htdocs/demo/index.html: $(DEMO) htdocs/demo
	cat $< | sed 's/..\/..\/lib\/Gettext.js/..\/lib\/Gettext.js/' > $@

htdocs/doc/html htdocs/demo htdocs/lib:
	mkdir -p $@

clean:
	rm -fr htdocs/doc
	rm -fr htdocs/demo
	rm -fr htdocs/tests


.PHONY: all clean install

SOURCE=../lib/Gettext.js
DEMO=../examples/normal/index.html
DEST?=/home/groups/jsgettext

all:htdocs/doc/html/Gettext.html htdocs/lib/Gettext.js htdocs/demo/index.html htdocs/tests

install: $(DEST) all
	tar --exclude=CVS -cf - * | (cd $< ; tar xf -)

htdocs/tests:
	mkdir -p $@
	cd ../tests && \
	tar --exclude=CVS -cf - * | (cd ../website/$@ ; tar xf -)

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


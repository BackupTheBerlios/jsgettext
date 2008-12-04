.PHONY: all clean install

SOURCE=../lib/Gettext.js
DEMO=../examples/normal/index.html
DEST?=/home/groups/jsgettext

all:htdocs/doc/html/Gettext.html htdocs/demo/Gettext.js htdocs/demo/index.html

install: $(DEST) all
	tar --exclude=CVS -cf - * | (cd $< ; tar xf -)

htdocs/doc/html/Gettext.html: $(SOURCE) htdocs/doc/html
	pod2html $< > $@
	rm pod2htm*.tmp

htdocs/demo/Gettext.js: $(SOURCE) htdocs/demo
	cp $< $@

htdocs/demo/index.html: $(DEMO) htdocs/demo
	cat $< | sed 's/..\/..\/lib\/Gettext.js/Gettext.js/' > $@

htdocs/doc/html htdocs/demo:
	mkdir -p $@

clean:
	rm -fr htdocs/doc
	rm -fr htdocs/demo

